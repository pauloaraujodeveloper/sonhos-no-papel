import { connection, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { createOrderInTransaction, OrderError } from "@/lib/orders/create-order";
import { MAX_QUANTITY_PER_LINE } from "@/lib/commerce/pricing";

/** Corpo do pedido. Preços e totais enviados pelo cliente não são aceitos. */
const addressSchema = z.object({
  cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z.string().trim().min(2).max(120),
  number: z.string().trim().min(1).max(20),
  district: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  complement: z.string().trim().max(120).nullish(),
  reference: z.string().trim().max(160).nullish(),
});

const orderSchema = z
  .object({
    customerName: z.string().trim().min(2, "Informe o nome").max(80),
    customerPhone: z.string().trim().min(10, "Informe o WhatsApp").max(20),
    fulfillment: z.enum(["PICKUP", "DELIVERY"]),
    address: addressSchema.nullish(),
    notes: z.string().trim().max(500).nullish(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1).max(64),
          variantId: z.string().min(1).max(64).nullish(),
          quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
        }),
      )
      .min(1, "O carrinho está vazio")
      .max(30),
  })
  .superRefine((value, ctx) => {
    if (value.fulfillment === "DELIVERY" && !value.address) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Informe o endereço para entrega" });
    }
  });

export async function POST(request: Request) {
  await connection();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados do pedido inválidos.", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 422 },
    );
  }

  const data = parsed.data;
  try {
    const order = await db.$transaction(
      (tx) =>
        createOrderInTransaction(tx, {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          fulfillment: data.fulfillment,
          district: data.address?.district ?? null,
          address: data.fulfillment === "DELIVERY" ? (data.address ?? null) : null,
          notes: data.notes ?? null,
          items: data.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity: item.quantity,
          })),
        }),
      // Timeout maior que o padrão (5 s): a transação faz várias consultas em rede ao Neon.
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000, maxWait: 5000 },
    );

    return NextResponse.json(
      {
        orderCode: order.orderCode,
        orderNumber: order.orderNumber,
        subtotalCents: order.subtotalCents,
        discountCents: order.discountCents,
        deliveryFeeCents: order.deliveryFeeCents,
        totalCents: order.totalCents,
        whatsappUrl: order.whatsappUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OrderError) {
      const status = error.code === "WHATSAPP_NOT_CONFIGURED" ? 503 : 422;
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details ?? [] },
        { status },
      );
    }
    console.error("[orders] falha ao criar pedido", error instanceof Error ? error.name : "erro");
    return NextResponse.json({ error: "Não foi possível criar o pedido. Tente novamente." }, { status: 500 });
  }
}
