"use server";

import type { InventoryMovementType } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";

const schema = z.object({
  target: z.string().min(3).max(140), // "product:<id>" ou "variant:<id>"
  type: z.enum(["ENTRY", "EXIT", "ADJUSTMENT"]),
  quantity: z.number().int().min(0).max(100000),
  reason: z.string().max(200),
});

function go(kind: "ok" | "erro", message: string): never {
  redirect(`/admin/estoque?${kind}=${encodeURIComponent(message)}`);
}

class StockError extends Error {}

/**
 * Entrada, saída ou ajuste (define a quantidade final). Atualização guardada: nunca deixa o
 * estoque negativo e registra o saldo depois da movimentação.
 */
export async function moveStockAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({
    target: String(formData.get("target") ?? ""),
    type: String(formData.get("type") ?? ""),
    quantity: Number(String(formData.get("quantity") ?? "")),
    reason: String(formData.get("reason") ?? "").trim(),
  });
  if (!parsed.success) go("erro", "Confira o item, o tipo e a quantidade.");
  const { target, type, quantity, reason } = parsed.data;
  if (type !== "ADJUSTMENT" && quantity < 1) go("erro", "A quantidade deve ser pelo menos 1.");

  const [kind, targetId] = target.split(":");
  if ((kind !== "product" && kind !== "variant") || !targetId) go("erro", "Item inválido.");

  try {
    await db.$transaction(async (tx) => {
      let productId: string;
      let variantId: string | null = null;
      let current: number;

      if (kind === "variant") {
        const v = await tx.productVariant.findUnique({ where: { id: targetId }, select: { id: true, productId: true, stockQuantity: true } });
        if (!v) throw new StockError("Variação não encontrada.");
        productId = v.productId;
        variantId = v.id;
        current = v.stockQuantity;
      } else {
        const p = await tx.product.findUnique({ where: { id: targetId }, select: { id: true, stockQuantity: true } });
        if (!p) throw new StockError("Produto não encontrado.");
        productId = p.id;
        current = p.stockQuantity;
      }

      const next = type === "ENTRY" ? current + quantity : type === "EXIT" ? current - quantity : quantity;
      if (next < 0) throw new StockError(`Saída maior que o estoque atual (${current}).`);

      // Atualização condicionada ao valor lido: se outra operação mexeu antes, aborta.
      const updated = variantId
        ? await tx.productVariant.updateMany({ where: { id: variantId, stockQuantity: current }, data: { stockQuantity: next } })
        : await tx.product.updateMany({ where: { id: productId, stockQuantity: current }, data: { stockQuantity: next } });
      if (updated.count === 0) throw new StockError("O estoque mudou durante a operação. Tente novamente.");

      await tx.inventoryMovement.create({
        data: {
          productId,
          variantId,
          type: type as InventoryMovementType,
          quantity: type === "ADJUSTMENT" ? Math.abs(next - current) : quantity,
          balanceAfter: next,
          reason: reason || (type === "ADJUSTMENT" ? `Ajuste de ${current} para ${next}` : null),
          adminUserId: admin.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof StockError) go("erro", error.message);
    console.error("[admin/inventory] falha", error instanceof Error ? error.name : "erro");
    go("erro", "Não foi possível registrar a movimentação.");
  }
  go("ok", "Movimentação registrada.");
}
