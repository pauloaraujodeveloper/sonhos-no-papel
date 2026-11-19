import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getStockStatus, type StockStatus } from "@/lib/commerce/pricing";

export const PAGE_SIZE = 12;

export type SortKey = "novidades" | "menor-preco" | "maior-preco";

export interface ProductListParams {
  q?: string;
  categorySlug?: string;
  sort?: SortKey;
  page?: number;
  minCents?: number;
  maxCents?: number;
  onlyFeatured?: boolean;
  onlyNew?: boolean;
  onlyPromo?: boolean;
  limit?: number;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  promotionalPriceCents: number | null;
  /** Preço efetivo (promocional quando houver). */
  effectivePriceCents: number;
  imageUrl: string | null;
  categoryName: string;
  categorySlug: string;
  stockStatus: StockStatus;
  availableQuantity: number;
  isNew: boolean;
  hasVariants: boolean;
  createdAt: Date;
}

export interface ProductList {
  items: ProductSummary[];
  total: number;
  page: number;
  pageCount: number;
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { category: true; images: true; variants: true };
}>;

/** Quantidade já reservada por produto/variação em pedidos aguardando confirmação. */
async function loadReserved(productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const rows = await db.inventoryReservation.groupBy({
    by: ["productId", "variantId"],
    // Reservas vencidas deixam de segurar estoque (sem precisar de rotina agendada).
    where: { productId: { in: productIds }, status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    _sum: { quantity: true },
  });
  return new Map(rows.map((r) => [`${r.productId}::${r.variantId ?? ""}`, r._sum.quantity ?? 0]));
}

function availableFor(product: ProductWithRelations, reserved: Map<string, number>): number {
  const activeVariants = product.variants.filter((v) => v.active);
  if (activeVariants.length > 0) {
    return activeVariants.reduce(
      (sum, v) => sum + Math.max(0, v.stockQuantity - (reserved.get(`${product.id}::${v.id}`) ?? 0)),
      0,
    );
  }
  return Math.max(0, product.stockQuantity - (reserved.get(`${product.id}::`) ?? 0));
}

function toSummary(product: ProductWithRelations, reserved: Map<string, number>): ProductSummary {
  const available = availableFor(product, reserved);
  const promo =
    product.promotionalPriceCents !== null && product.promotionalPriceCents < product.priceCents
      ? product.promotionalPriceCents
      : null;
  const firstImage = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    priceCents: product.priceCents,
    promotionalPriceCents: promo,
    effectivePriceCents: promo ?? product.priceCents,
    imageUrl: firstImage?.url ?? null,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    stockStatus: getStockStatus(available, product.lowStockThreshold),
    availableQuantity: available,
    isNew: product.isNew,
    hasVariants: product.variants.some((v) => v.active),
    createdAt: product.createdAt,
  };
}

export async function listCategories() {
  return db.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, description: true, imageUrl: true },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findFirst({
    where: { slug, active: true },
    select: { id: true, name: true, slug: true, description: true },
  });
}

/**
 * Lista produtos ativos com busca, filtros, ordenação e paginação.
 * A ordenação por preço usa o preço efetivo (promocional quando existir); por isso
 * ordena e pagina em memória. Para o porte de uma papelaria é suficiente.
 */
export async function listProducts(params: ProductListParams = {}): Promise<ProductList> {
  const where: Prisma.ProductWhereInput = {
    active: true,
    deletedAt: null,
    category: { active: true, ...(params.categorySlug ? { slug: params.categorySlug } : {}) },
  };
  if (params.q?.trim()) {
    const term = params.q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }
  if (params.onlyFeatured) where.featured = true;
  if (params.onlyNew) where.isNew = true;
  if (params.onlyPromo) where.promotionalPriceCents = { not: null };

  const products = await db.product.findMany({
    where,
    include: { category: true, images: true, variants: true },
  });
  const reserved = await loadReserved(products.map((p) => p.id));

  let items = products.map((p) => toSummary(p, reserved));
  if (params.onlyPromo) items = items.filter((i) => i.promotionalPriceCents !== null);
  if (params.minCents !== undefined) items = items.filter((i) => i.effectivePriceCents >= params.minCents!);
  if (params.maxCents !== undefined) items = items.filter((i) => i.effectivePriceCents <= params.maxCents!);

  const sort = params.sort ?? "novidades";
  items.sort((a, b) => {
    if (sort === "menor-preco") return a.effectivePriceCents - b.effectivePriceCents;
    if (sort === "maior-preco") return b.effectivePriceCents - a.effectivePriceCents;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const pageSize = params.limit ?? PAGE_SIZE;
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), pageCount);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageCount,
  };
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  images: { url: string; alt: string | null }[];
  variants: { id: string; name: string; priceCents: number; availableQuantity: number }[];
  related: ProductSummary[];
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await db.product.findFirst({
    where: { slug, active: true, deletedAt: null, category: { active: true } },
    include: { category: true, images: true, variants: true },
  });
  if (!product) return null;

  const relatedProducts = await db.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, active: true, deletedAt: null },
    include: { category: true, images: true, variants: true },
    take: 4,
    orderBy: { createdAt: "desc" },
  });
  const reserved = await loadReserved([product.id, ...relatedProducts.map((p) => p.id)]);
  const summary = toSummary(product, reserved);

  return {
    ...summary,
    description: product.description,
    images: [...product.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({ url: i.url, alt: i.alt })),
    variants: product.variants
      .filter((v) => v.active)
      .map((v) => ({
        id: v.id,
        name: v.name,
        priceCents: (summary.promotionalPriceCents ?? product.priceCents) + v.priceDeltaCents,
        availableQuantity: Math.max(0, v.stockQuantity - (reserved.get(`${product.id}::${v.id}`) ?? 0)),
      })),
    related: relatedProducts.map((p) => toSummary(p, reserved)),
  };
}
