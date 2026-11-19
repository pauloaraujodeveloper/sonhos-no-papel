import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createOrderInTransaction } from "./create-order";
import { changeOrderStatus, confirmPayment, OrderServiceError } from "./service";

const ROLLBACK = "__rollback__";
const runId = Date.now();

/** Integração com o banco real dentro de transação desfeita no final (nenhum dado permanece). */
describe.skipIf(!process.env.DATABASE_URL)("serviço de pedidos (Neon, com rollback)", () => {
  it("baixa estoque ao confirmar pagamento, devolve ao cancelar e libera reserva sem baixa", async () => {
    const r: Record<string, unknown> = {};

    try {
      await db.$transaction(
        async (tx) => {
          await tx.storeSettings.upsert({
            where: { id: "default" },
            create: { id: "default", whatsappNumber: "11912345678" },
            update: { whatsappNumber: "11912345678" },
          });
          const admin = await tx.adminUser.create({
            data: { email: `teste-${runId}@example.test`, name: "Admin Teste", passwordHash: "x", role: "OWNER" },
          });
          const category = await tx.category.create({ data: { name: "Teste", slug: `teste-svc-${runId}` } });
          const product = await tx.product.create({
            data: { name: "Caderno teste", slug: `caderno-teste-${runId}`, priceCents: 3000, stockQuantity: 5, categoryId: category.id },
          });
          const stock = async () => (await tx.product.findUniqueOrThrow({ where: { id: product.id } })).stockQuantity;

          // Pedido 1: confirma pagamento -> baixa definitiva
          const o1 = await createOrderInTransaction(tx, {
            customerName: "Cliente A",
            customerPhone: "11912340010",
            fulfillment: "PICKUP",
            items: [{ productId: product.id, quantity: 2 }],
          });
          r.stockAfterOrder = await stock();
          await confirmPayment(tx, { orderId: o1.orderId, adminId: admin.id });
          const afterPay = await tx.order.findUniqueOrThrow({ where: { id: o1.orderId } });
          r.stockAfterPayment = await stock();
          r.statusAfterPayment = afterPay.status;
          r.paymentStatus = afterPay.paymentStatus;
          r.consumed = await tx.inventoryReservation.count({ where: { orderId: o1.orderId, status: "CONSUMED" } });
          r.payments = await tx.payment.count({ where: { orderId: o1.orderId, status: "PAID" } });

          try {
            await confirmPayment(tx, { orderId: o1.orderId, adminId: admin.id });
            r.doublePayRejected = false;
          } catch (e) {
            r.doublePayRejected = e instanceof OrderServiceError && e.code === "ALREADY_PAID";
          }

          await changeOrderStatus(tx, { orderId: o1.orderId, to: "IN_PREPARATION", adminId: admin.id });
          try {
            await changeOrderStatus(tx, { orderId: o1.orderId, to: "AWAITING_CONFIRMATION", adminId: admin.id });
            r.backwardRejected = false;
          } catch (e) {
            r.backwardRejected = e instanceof OrderServiceError && e.code === "INVALID_TRANSITION";
          }

          // Cancelar pedido já baixado devolve o estoque
          await changeOrderStatus(tx, { orderId: o1.orderId, to: "CANCELLED", adminId: admin.id });
          r.stockAfterCancelConfirmed = await stock();

          // Pedido 2: cancelar antes de confirmar libera a reserva sem mexer no estoque físico
          const o2 = await createOrderInTransaction(tx, {
            customerName: "Cliente B",
            customerPhone: "11912340011",
            fulfillment: "PICKUP",
            items: [{ productId: product.id, quantity: 1 }],
          });
          await changeOrderStatus(tx, { orderId: o2.orderId, to: "CANCELLED", adminId: admin.id });
          r.stockAfterCancelUnconfirmed = await stock();
          r.released = await tx.inventoryReservation.count({ where: { orderId: o2.orderId, status: "RELEASED" } });
          r.history = await tx.orderStatusHistory.count({ where: { orderId: o1.orderId } });

          throw new Error(ROLLBACK);
        },
        { timeout: 60000, maxWait: 5000 },
      );
    } catch (error) {
      if (!(error instanceof Error && error.message === ROLLBACK)) throw error;
    }

    console.info("[integration/service]", JSON.stringify(r));
    expect(r.stockAfterOrder).toBe(5); // reserva não baixa o físico
    expect(r.stockAfterPayment).toBe(3);
    expect(r.statusAfterPayment).toBe("CONFIRMED");
    expect(r.paymentStatus).toBe("PAID");
    expect(r.consumed).toBe(1);
    expect(r.payments).toBe(1);
    expect(r.doublePayRejected).toBe(true);
    expect(r.backwardRejected).toBe(true);
    expect(r.stockAfterCancelConfirmed).toBe(5);
    expect(r.stockAfterCancelUnconfirmed).toBe(5);
    expect(r.released).toBe(1);
    expect(r.history).toBeGreaterThanOrEqual(3);
  }, 90000);
});
