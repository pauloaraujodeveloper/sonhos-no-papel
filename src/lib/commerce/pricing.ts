/**
 * Regras de precificação e validação de carrinho.
 *
 * Função pura: recebe o carrinho enviado pelo cliente e o catálogo lido do banco
 * no servidor. O valor enviado pelo navegador (preço, total) nunca é usado.
 * Apenas IDs e quantidades são aceitos do cliente.
 */

export const MAX_QUANTITY_PER_LINE = 99;

export interface CartLineInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CatalogVariant {
  id: string;
  name: string;
  active: boolean;
  priceDeltaCents: number;
  stockQuantity: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  active: boolean;
  deleted: boolean;
  priceCents: number;
  promotionalPriceCents: number | null;
  stockQuantity: number;
  variants: CatalogVariant[];
}

export type StockStatus = "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface PricedLine {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  quantity: number;
  /** Preço cheio por unidade, incluindo variação. */
  listUnitPriceCents: number;
  /** Preço efetivo por unidade (promocional quando existir). */
  unitPriceCents: number;
  lineTotalCents: number;
  lineDiscountCents: number;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

export type CartErrorCode =
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_INACTIVE"
  | "VARIANT_REQUIRED"
  | "VARIANT_NOT_FOUND"
  | "VARIANT_INACTIVE"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK"
  | "INVALID_QUANTITY";

export interface CartError {
  productId: string;
  variantId: string | null;
  code: CartErrorCode;
  message: string;
  availableQuantity?: number;
}

export type PriceCartResult =
  | { ok: true; cart: PricedCart }
  | { ok: false; errors: CartError[] };

/** Estado de estoque mostrado ao cliente. */
export function getStockStatus(stockQuantity: number, lowStockThreshold: number): StockStatus {
  if (stockQuantity <= 0) return "OUT_OF_STOCK";
  if (stockQuantity <= lowStockThreshold) return "LOW_STOCK";
  return "AVAILABLE";
}

/**
 * Agrupa linhas repetidas (mesmo produto e variação) somando quantidades.
 * Quantidades inválidas são mantidas para que a validação as reporte.
 */
export function mergeCartLines(lines: CartLineInput[]): CartLineInput[] {
  const merged = new Map<string, CartLineInput>();
  for (const line of lines) {
    const variantId = line.variantId ?? null;
    const key = `${line.productId}::${variantId ?? ""}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      merged.set(key, { productId: line.productId, variantId, quantity: line.quantity });
    }
  }
  return [...merged.values()];
}

function isPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

/**
 * Valida o carrinho contra o catálogo e calcula subtotal, descontos e total.
 * Retorna todos os erros encontrados, não apenas o primeiro.
 */
export function priceCart(
  lines: CartLineInput[],
  catalog: Map<string, CatalogProduct>,
): PriceCartResult {
  const errors: CartError[] = [];
  const priced: PricedLine[] = [];

  for (const line of mergeCartLines(lines)) {
    const variantId = line.variantId ?? null;
    const product = catalog.get(line.productId);

    if (!product || product.deleted) {
      errors.push({
        productId: line.productId,
        variantId,
        code: "PRODUCT_NOT_FOUND",
        message: "Produto não encontrado.",
      });
      continue;
    }

    if (!product.active) {
      errors.push({
        productId: product.id,
        variantId,
        code: "PRODUCT_INACTIVE",
        message: `${product.name} não está disponível no momento.`,
      });
      continue;
    }

    if (!isPositiveInteger(line.quantity) || line.quantity > MAX_QUANTITY_PER_LINE) {
      errors.push({
        productId: product.id,
        variantId,
        code: "INVALID_QUANTITY",
        message: `A quantidade de ${product.name} deve estar entre 1 e ${MAX_QUANTITY_PER_LINE}.`,
      });
      continue;
    }

    let variant: CatalogVariant | undefined;
    if (product.variants.length > 0) {
      if (!variantId) {
        errors.push({
          productId: product.id,
          variantId: null,
          code: "VARIANT_REQUIRED",
          message: `Escolha uma variação de ${product.name}.`,
        });
        continue;
      }
      variant = product.variants.find((v) => v.id === variantId);
      if (!variant) {
        errors.push({
          productId: product.id,
          variantId,
          code: "VARIANT_NOT_FOUND",
          message: `Variação de ${product.name} não encontrada.`,
        });
        continue;
      }
      if (!variant.active) {
        errors.push({
          productId: product.id,
          variantId,
          code: "VARIANT_INACTIVE",
          message: `${product.name} (${variant.name}) não está disponível.`,
        });
        continue;
      }
    } else if (variantId) {
      errors.push({
        productId: product.id,
        variantId,
        code: "VARIANT_NOT_FOUND",
        message: `${product.name} não possui variações.`,
      });
      continue;
    }

    const availableStock = variant ? variant.stockQuantity : product.stockQuantity;
    if (availableStock <= 0) {
      errors.push({
        productId: product.id,
        variantId,
        code: "OUT_OF_STOCK",
        message: `${product.name}${variant ? ` (${variant.name})` : ""} está esgotado.`,
        availableQuantity: 0,
      });
      continue;
    }
    if (line.quantity > availableStock) {
      errors.push({
        productId: product.id,
        variantId,
        code: "INSUFFICIENT_STOCK",
        message: `Há apenas ${availableStock} unidade(s) de ${product.name}${variant ? ` (${variant.name})` : ""} disponível(is).`,
        availableQuantity: availableStock,
      });
      continue;
    }

    const delta = variant ? variant.priceDeltaCents : 0;
    const listUnitPriceCents = product.priceCents + delta;
    const unitPriceCents =
      product.promotionalPriceCents !== null && product.promotionalPriceCents < product.priceCents
        ? product.promotionalPriceCents + delta
        : listUnitPriceCents;

    const lineListTotal = listUnitPriceCents * line.quantity;
    const lineTotalCents = unitPriceCents * line.quantity;

    priced.push({
      productId: product.id,
      variantId: variant ? variant.id : null,
      productName: product.name,
      variantName: variant ? variant.name : null,
      quantity: line.quantity,
      listUnitPriceCents,
      unitPriceCents,
      lineTotalCents,
      lineDiscountCents: lineListTotal - lineTotalCents,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const subtotalCents = priced.reduce(
    (sum, l) => sum + l.listUnitPriceCents * l.quantity,
    0,
  );
  const discountCents = priced.reduce((sum, l) => sum + l.lineDiscountCents, 0);
  const totalCents = priced.reduce((sum, l) => sum + l.lineTotalCents, 0);

  return {
    ok: true,
    cart: { lines: priced, subtotalCents, discountCents, totalCents },
  };
}

/** Formata centavos em moeda brasileira, ex.: 7000 -> "R$ 70,00". */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
}
