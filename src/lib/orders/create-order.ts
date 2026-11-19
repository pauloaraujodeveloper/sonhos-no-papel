import {
  FulfillmentStatus,
  FulfillmentType,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { quoteFulfillment, type DeliveryZoneRule } from "@/lib/commerce/delivery";
import {
  type CartLineInput,
  type CatalogProduct,
  type PricedCart,
  priceCart,
  type CartError,
} from "@/lib/commerce/pricing";
import { buildOrderMessage, buildWhatsAppUrl, formatOrderCode, normalizeWhatsAppNumber } from "@/lib/commerce/whatsapp";

/** Reserva temporária até a proprietária confirmar o pedido (PRD RF-013). */
export const RESERVATION_HOURS = 48;

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  fulfillment: FulfillmentType;
  district?: string | null;
  address?: {
    cep: string;
    street: string;
    number: string;
    district: string;
    city: string;
    complement?: string | null;
    reference?: string | null;
  } | null;
  notes?: string | null;
  items: CartLineInput[];
}

export class OrderError extends Error {
  constructor(
    public readonly code:
      | "WHATSAPP_NOT_CONFIGURED"
      | "INVALID_CART"
      | "AREA_NOT_SERVED"
      | "INVALID_PHONE"
      | "ADDRESS_REQUIRED",
    message: string,
    public readonly details?: CartError[],
  ) {
    super(message);
    this.name = "OrderError";
  }
}

export interface CreatedOrder {
  orderId: string;
  orderNumber: number;
  orderCode: string;
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  whatsappUrl: string;
}

/**
 * Carrega o catálogo com o estoque livre: estoque físico menos reservas ativas.
 * Reservas expiradas ainda não são liberadas automaticamente (job pendente).
 */
export async function loadCatalog(
  tx: Prisma.TransactionClient,
  productIds: string[],
): Promise<Map<string, CatalogProduct>> {
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });

  const reservations = await tx.inventoryReservation.groupBy({
    by: ["productId", "variantId"],
    where: { productId: { in: productIds }, status: "ACTIVE" },
    _sum: { quantity: true },
  });
  const reservedByKey = new Map<string, number>();
  for (const row of reservations) {
    reservedByKey.set(`${row.productId}::${row.variantId ?? ""}`, row._sum.quantity ?? 0);
  }

  const catalog = new Map<string, CatalogProduct>();
  for (const product of products) {
    const reservedProduct = reservedByKey.get(`${product.id}::`) ?? 0;
    catalog.set(product.id, {
      id: product.id,
      name: product.name,
      active: product.active,
      deleted: product.deletedAt !== null,
      priceCents: product.priceCents,
      promotionalPriceCents: product.promotionalPriceCents,
      stockQuantity: product.stockQuantity - reservedProduct,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        active: variant.active,
        priceDeltaCents: variant.priceDeltaCents,
        stockQuantity: variant.stockQuantity - (reservedByKey.get(`${product.id}::${variant.id}`) ?? 0),
      })),
    });
  }
  return catalog;
}

export async function loadDeliveryRules(
  tx: Prisma.TransactionClient,
  district: string | null | undefined,
) {
  const settings = await tx.storeSettings.findUnique({ where: { id: "default" } });
  const zones = await tx.deliveryZone.findMany({ where: { active: true } });

  const matched =
    district && zones.find((z) => z.name.trim().toLowerCase() === district.trim().toLowerCase());
  const zone: DeliveryZoneRule | null = matched
    ? { name: matched.name, feeCents: matched.feeCents, freeAboveCents: matched.freeAboveCents }
    : null;

  const fallback = settings
    ? {
        feeCents: settings.deliveryFlatFeeCents,
        freeAboveCents: settings.deliveryFreeAboveCents,
      }
    : null;

  return { settings, zone, fallback };
}

/**
 * Cria o pedido dentro de uma transação. Preço, estoque e taxa de entrega são
 * recalculados aqui, no servidor. Valores enviados pelo navegador são ignorados.
 */
export async function createOrderInTransaction(
  tx: Prisma.TransactionClient,
  input: CreateOrderInput,
): Promise<CreatedOrder> {
  const phone = normalizeWhatsAppNumber(input.customerPhone);
  if (!phone) {
    throw new OrderError("INVALID_PHONE", "Telefone inválido. Informe DDD e número.");
  }

  if (input.fulfillment === "DELIVERY" && !input.address) {
    throw new OrderError("ADDRESS_REQUIRED", "Informe o endereço para entrega.");
  }

  const { settings, zone, fallback } = await loadDeliveryRules(tx, input.district);
  if (!settings?.whatsappNumber) {
    throw new OrderError(
      "WHATSAPP_NOT_CONFIGURED",
      "O número de WhatsApp da loja ainda não está configurado.",
    );
  }
  const storeWhatsApp = settings.whatsappNumber;

  const catalog = await loadCatalog(
    tx,
    [...new Set(input.items.map((item) => item.productId))],
  );
  const pricing = priceCart(input.items, catalog);
  if (!pricing.ok) {
    throw new OrderError("INVALID_CART", "Alguns itens não podem ser pedidos agora.", pricing.errors);
  }
  const cart: PricedCart = pricing.cart;

  const delivery = quoteFulfillment({
    fulfillment: input.fulfillment,
    subtotalCents: cart.subtotalCents - cart.discountCents,
    zone,
    fallback,
  });
  if (!delivery.ok) {
    throw new OrderError("AREA_NOT_SERVED", "Ainda não entregamos nessa região.");
  }

  const totalCents = cart.totalCents + delivery.feeCents;
  const customer = await tx.customer.upsert({
    where: { phone },
    create: { phone, name: input.customerName },
    update: { name: input.customerName },
  });

  const expiresAt = new Date(Date.now() + RESERVATION_HOURS * 60 * 60 * 1000);
  const isDelivery = input.fulfillment === "DELIVERY";
  const addressFields = isDelivery && input.address ? input.address : null;

  const order = await tx.order.create({
    data: {
      customerId: customer.id,
      customerName: input.customerName,
      customerPhone: phone,
      fulfillmentType: input.fulfillment,
      deliveryZoneName: zone?.name ?? null,
      deliveryCep: addressFields?.cep ?? null,
      deliveryStreet: addressFields?.street ?? null,
      deliveryNumber: addressFields?.number ?? null,
      deliveryDistrict: addressFields?.district ?? null,
      deliveryCity: addressFields?.city ?? null,
      deliveryComplement: addressFields?.complement ?? null,
      deliveryReference: addressFields?.reference ?? null,
      notes: input.notes?.trim() || null,
      subtotalCents: cart.subtotalCents,
      discountCents: cart.discountCents,
      deliveryFeeCents: delivery.feeCents,
      totalCents,
      status: OrderStatus.AWAITING_CONFIRMATION,
      paymentStatus: PaymentStatus.NOT_INFORMED,
      fulfillmentStatus: isDelivery ? FulfillmentStatus.DELIVERY_PENDING : FulfillmentStatus.PICKUP_PENDING,
      items: {
        create: cart.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          productName: line.productName,
          variantName: line.variantName,
          listUnitPriceCents: line.listUnitPriceCents,
          unitPriceCents: line.unitPriceCents,
          quantity: line.quantity,
          lineTotalCents: line.lineTotalCents,
        })),
      },
    },
    select: { id: true, orderNumber: true },
  });

  for (const line of cart.lines) {
    await tx.inventoryReservation.create({
      data: {
        orderId: order.id,
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        status: "ACTIVE",
        expiresAt,
      },
    });
    const current = await tx.product.findUniqueOrThrow({
      where: { id: line.productId },
      select: { stockQuantity: true },
    });
    await tx.inventoryMovement.create({
      data: {
        productId: line.productId,
        variantId: line.variantId,
        type: "ORDER_RESERVED",
        quantity: line.quantity,
        balanceAfter: current.stockQuantity,
        orderId: order.id,
        reason: `Reserva do pedido ${formatOrderCode(order.orderNumber)}`,
      },
    });
  }

  await tx.orderStatusHistory.create({
    data: {
      orderId: order.id,
      fromStatus: null,
      toStatus: OrderStatus.AWAITING_CONFIRMATION,
      actorType: "CUSTOMER",
      note: "Pedido criado pelo site",
    },
  });

  const message = buildOrderMessage({
    orderNumber: order.orderNumber,
    customerName: input.customerName,
    customerPhone: phone,
    lines: cart.lines,
    subtotalCents: cart.subtotalCents,
    discountCents: cart.discountCents,
    deliveryFeeCents: delivery.feeCents,
    totalCents,
    fulfillment: input.fulfillment,
    address: addressFields
      ? [
          `${addressFields.street}, ${addressFields.number}`,
          addressFields.complement,
          addressFields.district,
          addressFields.city,
          `CEP ${addressFields.cep}`,
          addressFields.reference ? `Ref.: ${addressFields.reference}` : null,
        ]
          .filter(Boolean)
          .join(" - ")
      : null,
    notes: input.notes,
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderCode: formatOrderCode(order.orderNumber),
    subtotalCents: cart.subtotalCents,
    discountCents: cart.discountCents,
    deliveryFeeCents: delivery.feeCents,
    totalCents,
    whatsappUrl: buildWhatsAppUrl(storeWhatsApp, message),
  };
}
