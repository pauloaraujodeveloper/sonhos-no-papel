import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createOrderInTransaction, type CreatedOrder, OrderError } from "./create-order";

const ROLLBACK = "__rollback__";
const runId = Date.now();

/**
 * Teste de integração contra o banco configurado em DATABASE_URL.
 * Tudo é criado dentro de uma transação que é desfeita no final: nenhum dado fica no banco.
 */
describe.skipIf(!process.env.DATABASE_URL)("createOrderInTransaction (Neon, com rollback)", () => {
  it("precifica no servidor, reserva estoque, aplica entrega e recusa excesso", async () => {
    const results: Record<string, unknown> = {};

    try {
      await db.$transaction(
        async (tx) => {
          await tx.storeSettings.upsert({
            where: { id: "default" },
            create: {
              id: "default",
              whatsappNumber: "11912345678",
              deliveryFlatFeeCents: 800,
              deliveryFreeAboveCents: 15000,
            },
            update: { whatsappNumber: "11912345678", deliveryFlatFeeCents: 800, deliveryFreeAboveCents: 15000 },
          });

          const category = await tx.category.create({
            data: { name: "Teste", slug: `teste-${runId}` },
          });
          const product = await tx.product.create({
            data: {
              name: "Caneta de teste",
              slug: `caneta-teste-${runId}`,
              priceCents: 1000,
              stockQuantity: 5,
              categoryId: category.id,
            },
          });

          const first: CreatedOrder = await createOrderInTransaction(tx, {
            customerName: "Cliente Teste",
            customerPhone: "(11) 91234-5678",
            fulfillment: "PICKUP",
            items: [{ productId: product.id, quantity: 2 }],
          });
          results.first = first;

          const afterFirst = await tx.product.findUniqueOrThrow({ where: { id: product.id } });
          results.physicalStockAfterFirst = afterFirst.stockQuantity;
          results.reservations = await tx.inventoryReservation.count({ where: { productId: product.id, status: "ACTIVE" } });

          // Estoque livre = 5 - 2 reservados = 3. Pedir 4 deve ser recusado.
          try {
            await createOrderInTransaction(tx, {
              customerName: "Cliente Teste 2",
              customerPhone: "11912340000",
              fulfillment: "PICKUP",
              items: [{ productId: product.id, quantity: 4 }],
            });
            results.overSellRejected = false;
          } catch (error) {
            results.overSellRejected = error instanceof OrderError && error.code === "INVALID_CART";
            results.overSellDetail = error instanceof OrderError ? error.details?.[0]?.code : null;
          }

          // Entrega sem zona cadastrada: usa a taxa geral (800) porque o subtotal (2000) < 15000.
          const delivery = await createOrderInTransaction(tx, {
            customerName: "Cliente Entrega",
            customerPhone: "11912340001",
            fulfillment: "DELIVERY",
            district: "Bairro Inexistente",
            address: {
              cep: "01001-000",
              street: "Rua Teste",
              number: "10",
              district: "Bairro Inexistente",
              city: "São Paulo",
            },
            items: [{ productId: product.id, quantity: 1 }],
          });
          results.deliveryFee = delivery.deliveryFeeCents;
          results.deliveryTotal = delivery.totalCents;

          throw new Error(ROLLBACK);
        },
        { isolationLevel: "Serializable", timeout: 30000, maxWait: 5000 },
      );
    } catch (error) {
      if (!(error instanceof Error && error.message === ROLLBACK)) throw error;
    }

    console.info("[integration] resultados:", JSON.stringify(results));

    const first = results.first as CreatedOrder;
    expect(first.subtotalCents).toBe(2000);
    expect(first.totalCents).toBe(2000);
    expect(first.orderCode).toMatch(/^SP-\d{4,}$/);
    expect(first.whatsappUrl.startsWith("https://wa.me/5511912345678?text=")).toBe(true);
    expect(results.physicalStockAfterFirst).toBe(5);
    expect(results.reservations).toBe(1);
    expect(results.overSellRejected).toBe(true);
    expect(results.overSellDetail).toBe("INSUFFICIENT_STOCK");
    expect(results.deliveryFee).toBe(800);
    expect(results.deliveryTotal).toBe(1000 + 800);

    // Nada deve ter ficado no banco após o rollback.
    const leftovers = await db.category.count({ where: { slug: `teste-${runId}` } });
    expect(leftovers).toBe(0);
  }, 60000);
});
