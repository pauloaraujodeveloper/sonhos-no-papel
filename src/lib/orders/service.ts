import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { formatOrderCode } from "@/lib/commerce/whatsapp";
import { canTransition, STOCK_CONSUMED_STATUSES, type OrderStatusKey } from "./status";

/** Operações administrativas sobre pedidos. Sempre chamadas dentro de uma transação. */
export class OrderServiceError extends Error {
  constructor(
    public readonly code:
      | "ORDER_NOT_FOUND"
      | "INVALID_TRANSITION"
      | "INSUFFICIENT_STOCK"
      | "ALREADY_PAID"
      | "ORDER_CANCELLED"
      | "INVALID_PAYMENT_STATUS",
    message: string,
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

type Tx = Prisma.TransactionClient;

interface Actor {
  adminId: string;
}

async function adjustStock(tx: Tx, productId: string, variantId: string | null, delta: number): Promise<number> {
  if (variantId) {
    const result = await tx.productVariant.updateMany({
      where: { id: variantId, ...(delta < 0 ? { stockQuantity: { gte: -delta } } : {}) },
      data: { stockQuantity: { increment: delta } },
    });
    if (result.count === 0) throw new OrderServiceError("INSUFFICIENT_STOCK", "Estoque insuficiente para confirmar o pedido.");
    return (await tx.productVariant.findUniqueOrThrow({ where: { id: variantId }, select: { stockQuantity: true } })).stockQuantity;
  }
  const result = await tx.product.updateMany({
    where: { id: productId, ...(delta < 0 ? { stockQuantity: { gte: -delta } } : {}) },
    data: { stockQuantity: { increment: delta } },
  });
  if (result.count === 0) throw new OrderServiceError("INSUFFICIENT_STOCK", "Estoque insuficiente para confirmar o pedido.");
  return (await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { stockQuantity: true } })).stockQuantity;
}

/** Baixa definitiva do estoque ao confirmar o pedido: reservas ativas viram saída. */
async function consumeReservations(tx: Tx, orderId: string, orderNumber: number, actor: Actor) {
  const reservations = await tx.inventoryReservation.findMany({ where: { orderId, status: "ACTIVE" } });
  for (const r of reservations) {
    const balanceAfter = await adjustStock(tx, r.productId, r.variantId, -r.quantity);
    await tx.inventoryMovement.create({
      data: {
        productId: r.productId,
        variantId: r.variantId,
        type: "ORDER_CONFIRMED",
        quantity: r.quantity,
        balanceAfter,
        orderId,
        adminUserId: actor.adminId,
        reason: `Baixa do pedido ${formatOrderCode(orderNumber)}`,
      },
    });
    await tx.inventoryReservation.update({ where: { id: r.id }, data: { status: "CONSUMED" } });
  }
}

/** Cancelamento: libera reservas ativas e devolve ao estoque o que já havia sido baixado. */
async function releaseOrderStock(tx: Tx, orderId: string, orderNumber: number, actor: Actor) {
  const reservations = await tx.inventoryReservation.findMany({
    where: { orderId, status: { in: ["ACTIVE", "CONSUMED"] } },
  });
  for (const r of reservations) {
    let balanceAfter: number;
    if (r.status === "CONSUMED") {
      balanceAfter = await adjustStock(tx, r.productId, r.variantId, r.quantity);
    } else {
      const current = r.variantId
        ? await tx.productVariant.findUniqueOrThrow({ where: { id: r.variantId }, select: { stockQuantity: true } })
        : await tx.product.findUniqueOrThrow({ where: { id: r.productId }, select: { stockQuantity: true } });
      balanceAfter = current.stockQuantity;
    }
    await tx.inventoryMovement.create({
      data: {
        productId: r.productId,
        variantId: r.variantId,
        type: "ORDER_RELEASED",
        quantity: r.quantity,
        balanceAfter,
        orderId,
        adminUserId: actor.adminId,
        reason: `Cancelamento do pedido ${formatOrderCode(orderNumber)}`,
      },
    });
    await tx.inventoryReservation.update({ where: { id: r.id }, data: { status: "RELEASED", releasedAt: new Date() } });
  }
}

async function loadOrder(tx: Tx, orderId: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, status: true, paymentStatus: true, fulfillmentType: true, totalCents: true },
  });
  if (!order) throw new OrderServiceError("ORDER_NOT_FOUND", "Pedido não encontrado.");
  return order;
}

export async function changeOrderStatus(
  tx: Tx,
  input: { orderId: string; to: OrderStatus; adminId: string; note?: string | null },
) {
  const order = await loadOrder(tx, input.orderId);
  if (!canTransition(order.status as OrderStatusKey, input.to as OrderStatusKey)) {
    throw new OrderServiceError("INVALID_TRANSITION", "Essa mudança de status não é permitida.");
  }
  const actor = { adminId: input.adminId };

  if (input.to === "CONFIRMED") await consumeReservations(tx, order.id, order.orderNumber, actor);
  if (input.to === "CANCELLED") {
    await releaseOrderStock(tx, order.id, order.orderNumber, actor);
    if (order.paymentStatus === "NOT_INFORMED" || order.paymentStatus === "AWAITING_PAYMENT" || order.paymentStatus === "UNDER_REVIEW") {
      await recordPaymentChange(tx, order.id, order.paymentStatus, "CANCELLED", actor, "Pedido cancelado");
    }
  }

  const fulfillmentStatus =
    input.to === "OUT_FOR_DELIVERY"
      ? "OUT_FOR_DELIVERY"
      : input.to === "COMPLETED"
        ? order.fulfillmentType === "DELIVERY"
          ? "DELIVERED"
          : "PICKED_UP"
        : undefined;

  await tx.order.update({
    where: { id: order.id },
    data: { status: input.to, ...(fulfillmentStatus ? { fulfillmentStatus } : {}) },
  });
  await tx.orderStatusHistory.create({
    data: {
      orderId: order.id,
      fromStatus: order.status,
      toStatus: input.to,
      actorType: "ADMIN",
      adminUserId: input.adminId,
      note: input.note?.trim() || null,
    },
  });
}

async function recordPaymentChange(
  tx: Tx,
  orderId: string,
  from: PaymentStatus,
  to: PaymentStatus,
  actor: Actor,
  note?: string | null,
) {
  await tx.order.update({ where: { id: orderId }, data: { paymentStatus: to } });
  await tx.paymentStatusHistory.create({
    data: { orderId, fromStatus: from, toStatus: to, actorType: "ADMIN", adminUserId: actor.adminId, note: note?.trim() || null },
  });
}

/**
 * Registra o recebimento do Pix conferido pela proprietária.
 * Confirma o pedido (baixa o estoque) se ele ainda estiver aguardando confirmação.
 */
export async function confirmPayment(tx: Tx, input: { orderId: string; adminId: string; note?: string | null }) {
  const order = await loadOrder(tx, input.orderId);
  if (order.status === "CANCELLED") throw new OrderServiceError("ORDER_CANCELLED", "Pedido cancelado não pode receber pagamento.");
  if (order.paymentStatus === "PAID") throw new OrderServiceError("ALREADY_PAID", "O pagamento já foi registrado.");

  if (order.status === "NEW" || order.status === "AWAITING_CONFIRMATION") {
    await changeOrderStatus(tx, { orderId: order.id, to: "CONFIRMED", adminId: input.adminId, note: "Confirmado ao registrar o pagamento" });
  }

  await tx.payment.create({
    data: { orderId: order.id, method: "PIX_MANUAL", amountCents: order.totalCents, status: "PAID", paidAt: new Date(), note: input.note?.trim() || null },
  });
  await recordPaymentChange(tx, order.id, order.paymentStatus, "PAID", { adminId: input.adminId }, input.note ?? "Pix conferido pela proprietária");
}

/** Demais estados financeiros (aguardando, em análise, cancelado, estornado). "Pago" só via confirmPayment. */
export async function setPaymentStatus(
  tx: Tx,
  input: { orderId: string; to: PaymentStatus; adminId: string; note?: string | null },
) {
  if (input.to === "PAID" || input.to === "NOT_INFORMED") {
    throw new OrderServiceError("INVALID_PAYMENT_STATUS", "Use a confirmação de pagamento para marcar como pago.");
  }
  const order = await loadOrder(tx, input.orderId);
  if (order.paymentStatus === "PAID" && input.to !== "REFUNDED") {
    throw new OrderServiceError("INVALID_PAYMENT_STATUS", "Um pagamento confirmado só pode ser estornado.");
  }
  if (order.paymentStatus === input.to) return;
  await recordPaymentChange(tx, order.id, order.paymentStatus, input.to, { adminId: input.adminId }, input.note);
}

export { STOCK_CONSUMED_STATUSES };
