import { describe, expect, it } from "vitest";
import {
  type CatalogProduct,
  formatBRL,
  getStockStatus,
  mergeCartLines,
  priceCart,
} from "./pricing";

const caneta: CatalogProduct = {
  id: "p-caneta",
  name: "Caneta gel",
  active: true,
  deleted: false,
  priceCents: 1000,
  promotionalPriceCents: null,
  stockQuantity: 5,
  variants: [],
};

const caderno: CatalogProduct = {
  id: "p-caderno",
  name: "Caderno pontilhado",
  active: true,
  deleted: false,
  priceCents: 3500,
  promotionalPriceCents: 3000,
  stockQuantity: 2,
  variants: [],
};

const pincel: CatalogProduct = {
  id: "p-pincel",
  name: "Pincel",
  active: true,
  deleted: false,
  priceCents: 1500,
  promotionalPriceCents: null,
  stockQuantity: 0,
  variants: [],
};

const agenda: CatalogProduct = {
  id: "p-agenda",
  name: "Agenda 2027",
  active: true,
  deleted: false,
  priceCents: 5000,
  promotionalPriceCents: null,
  stockQuantity: 10,
  variants: [
    { id: "v-azul", name: "Azul", active: true, priceDeltaCents: 0, stockQuantity: 4 },
    { id: "v-rosa", name: "Rosa", active: true, priceDeltaCents: 200, stockQuantity: 0 },
  ],
};

const catalog = new Map([caneta, caderno, pincel, agenda].map((p) => [p.id, p]));

describe("priceCart", () => {
  it("calcula subtotal, descontos e total no servidor", () => {
    const result = priceCart(
      [
        { productId: "p-caneta", quantity: 2 },
        { productId: "p-caderno", quantity: 1 },
      ],
      catalog,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cart.subtotalCents).toBe(2000 + 3500);
    expect(result.cart.discountCents).toBe(500);
    expect(result.cart.totalCents).toBe(2000 + 3000);
  });

  it("usa o preço promocional e o preço da variação", () => {
    const result = priceCart(
      [{ productId: "p-agenda", variantId: "v-azul", quantity: 1 }],
      catalog,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cart.lines[0].unitPriceCents).toBe(5000);
  });

  it("bloqueia produto esgotado", () => {
    const result = priceCart([{ productId: "p-pincel", quantity: 1 }], catalog);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe("OUT_OF_STOCK");
  });

  it("não permite quantidade acima do estoque disponível", () => {
    const result = priceCart([{ productId: "p-caderno", quantity: 3 }], catalog);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatchObject({
      code: "INSUFFICIENT_STOCK",
      availableQuantity: 2,
    });
  });

  it("considera o estoque somado de linhas repetidas", () => {
    const result = priceCart(
      [
        { productId: "p-caderno", quantity: 1 },
        { productId: "p-caderno", quantity: 2 },
      ],
      catalog,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe("INSUFFICIENT_STOCK");
  });

  it("exige variação quando o produto possui variações", () => {
    const result = priceCart([{ productId: "p-agenda", quantity: 1 }], catalog);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe("VARIANT_REQUIRED");
  });

  it("valida o estoque específico da variação", () => {
    const result = priceCart(
      [{ productId: "p-agenda", variantId: "v-rosa", quantity: 1 }],
      catalog,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe("OUT_OF_STOCK");
  });

  it("rejeita produto inexistente, inativo ou removido", () => {
    const inactive = new Map(catalog);
    inactive.set("p-caneta", { ...caneta, active: false });
    inactive.set("p-caderno", { ...caderno, deleted: true });

    const result = priceCart(
      [
        { productId: "p-caneta", quantity: 1 },
        { productId: "p-caderno", quantity: 1 },
        { productId: "p-inexistente", quantity: 1 },
      ],
      inactive,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((e) => e.code)).toEqual([
      "PRODUCT_INACTIVE",
      "PRODUCT_NOT_FOUND",
      "PRODUCT_NOT_FOUND",
    ]);
  });

  it("rejeita quantidades fracionadas, zero, negativas ou acima do limite", () => {
    for (const quantity of [0, -1, 1.5, 100]) {
      const result = priceCart([{ productId: "p-caneta", quantity }], catalog);
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.errors[0].code).toBe("INVALID_QUANTITY");
    }
  });
});

describe("mergeCartLines", () => {
  it("separa linhas com variações diferentes", () => {
    const merged = mergeCartLines([
      { productId: "p-agenda", variantId: "v-azul", quantity: 1 },
      { productId: "p-agenda", variantId: "v-rosa", quantity: 1 },
      { productId: "p-agenda", variantId: "v-azul", quantity: 2 },
    ]);
    expect(merged).toHaveLength(2);
    expect(merged.find((l) => l.variantId === "v-azul")?.quantity).toBe(3);
  });
});

describe("getStockStatus", () => {
  it("classifica disponível, últimas unidades e esgotado", () => {
    expect(getStockStatus(0, 3)).toBe("OUT_OF_STOCK");
    expect(getStockStatus(3, 3)).toBe("LOW_STOCK");
    expect(getStockStatus(4, 3)).toBe("AVAILABLE");
  });
});

describe("formatBRL", () => {
  it("formata em real brasileiro", () => {
    expect(formatBRL(7000)).toMatch(/70,00/);
  });
});
