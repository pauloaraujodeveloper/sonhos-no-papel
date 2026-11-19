import { connection, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { quoteFulfillment } from "@/lib/commerce/delivery";
import { MAX_QUANTITY_PER_LINE, priceCart } from "@/lib/commerce/pricing";
import { loadCatalog, loadDeliveryRules } from "@/lib/orders/create-order";

/**
 * Precifica o carrinho no servidor para exibição (carrinho e checkout).
 * Aceita apenas IDs e quantidades. Responde linha a linha para que a interface
 * mostre qual item está esgotado ou sem estoque suficiente.
 */
const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        variantId: z.string().min(1).max(64).nullish(),
        quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
      }),
    )
    .max(30),
  fulfillment: z.enum(["PICKUP", "DELIVERY"]).optional(),
  district: z.string().trim().max(80).nullish(),
});

export async function POST(request: Request) {
  await connection();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados do carrinho inválidos." }, { status: 422 });
  }
  const { items, fulfillment, district } = parsed.data;

  const productIds = [...new Set(items.map((i) => i.productId))];
  const [catalog, products] = await Promise.all([
    loadCatalog(db, productIds),
    db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, slug: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } },
    }),
  ]);
  const meta = new Map(products.map((p) => [p.id, { slug: p.slug, imageUrl: p.images[0]?.url ?? null }]));

  const lines = items.map((item) => {
    const result = priceCart([{ ...item, variantId: item.variantId ?? null }], catalog);
    const info = meta.get(item.productId);
    if (!result.ok) {
      const error = result.errors[0];
      return {
        ok: false as const,
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        slug: info?.slug ?? null,
        code: error.code,
        message: error.message,
        availableQuantity: error.availableQuantity ?? 0,
      };
    }
    const line = result.cart.lines[0];
    return { ok: true as const, ...line, slug: info?.slug ?? null, imageUrl: info?.imageUrl ?? null };
  });

  const valid = lines.filter((l) => l.ok);
  const subtotalCents = valid.reduce((s, l) => s + (l.ok ? l.listUnitPriceCents * l.quantity : 0), 0);
  const discountCents = valid.reduce((s, l) => s + (l.ok ? l.lineDiscountCents : 0), 0);
  const itemsTotalCents = valid.reduce((s, l) => s + (l.ok ? l.lineTotalCents : 0), 0);

  let deliveryFeeCents = 0;
  let deliveryAvailable = true;
  if (fulfillment === "DELIVERY") {
    const { zone, fallback } = await loadDeliveryRules(db, district);
    const quote = quoteFulfillment({ fulfillment, subtotalCents: itemsTotalCents, zone, fallback });
    if (quote.ok) deliveryFeeCents = quote.feeCents;
    else deliveryAvailable = false;
  }

  return NextResponse.json({
    lines,
    subtotalCents,
    discountCents,
    deliveryFeeCents,
    deliveryAvailable,
    totalCents: itemsTotalCents + deliveryFeeCents,
    hasErrors: lines.some((l) => !l.ok),
  });
}
