import { describe, expect, it } from "vitest";
import {
  buildOrderMessage,
  buildWhatsAppUrl,
  formatOrderCode,
  normalizeWhatsAppNumber,
} from "./whatsapp";

describe("normalizeWhatsAppNumber", () => {
  it("aceita formatos comuns brasileiros e retorna apenas dígitos com DDI", () => {
    expect(normalizeWhatsAppNumber("+55 (11) 91234-5678")).toBe("5511912345678");
    expect(normalizeWhatsAppNumber("11 91234-5678")).toBe("5511912345678");
    expect(normalizeWhatsAppNumber("5511 3456-7890")).toBe("551134567890");
  });

  it("retorna null para números inválidos", () => {
    expect(normalizeWhatsAppNumber("123")).toBeNull();
    expect(normalizeWhatsAppNumber("")).toBeNull();
  });
});

describe("buildWhatsAppUrl", () => {
  it("gera link wa.me com a mensagem codificada", () => {
    const url = buildWhatsAppUrl("(11) 91234-5678", "Olá & bem-vindo");
    expect(url).toBe("https://wa.me/5511912345678?text=Ol%C3%A1%20%26%20bem-vindo");
  });

  it("lança erro para telefone inválido", () => {
    expect(() => buildWhatsAppUrl("abc", "x")).toThrow();
  });
});

describe("formatOrderCode", () => {
  it("formata como SP-0001", () => {
    expect(formatOrderCode(1)).toBe("SP-0001");
    expect(formatOrderCode(42)).toBe("SP-0042");
  });
});

describe("buildOrderMessage", () => {
  it("inclui pedido, itens, taxa de entrega, recebimento e endereço", () => {
    const message = buildOrderMessage({
      orderNumber: 42,
      customerName: "Maria",
      customerPhone: "11912345678",
      fulfillment: "DELIVERY",
      address: "Rua A, 10, Centro",
      deliveryFeeCents: 800,
      discountCents: 0,
      subtotalCents: 2000,
      totalCents: 2800,
      lines: [
        {
          productId: "p1",
          variantId: null,
          productName: "Caneta gel",
          variantName: null,
          quantity: 2,
          listUnitPriceCents: 1000,
          unitPriceCents: 1000,
          lineTotalCents: 2000,
          lineDiscountCents: 0,
        },
      ],
      notes: "Embrulhar para presente",
    });

    expect(message).toContain("SP-0042");
    expect(message).toContain("*Cliente:* Maria");
    expect(message).toContain("Caneta gel");
    expect(message).toContain("Quantidade: 2 x");
    // formatBRL usa espaço não separável (U+00A0) entre "R$" e o valor.
    expect(message).toMatch(/\*Entrega:\* R\$\s8,00/);
    expect(message).toMatch(/\*Total:\* R\$\s28,00/);
    expect(message).toContain("*Recebimento:* Entrega");
    expect(message).toContain("*Endereço:* Rua A, 10, Centro");
    expect(message).toContain("*Observações:* Embrulhar para presente");
  });

  it("não exibe endereço para retirada e informa taxa zero", () => {
    const message = buildOrderMessage({
      orderNumber: 1,
      customerName: "Ana",
      customerPhone: "11912345678",
      fulfillment: "PICKUP",
      address: "não deve aparecer",
      deliveryFeeCents: 0,
      discountCents: 0,
      subtotalCents: 1000,
      totalCents: 1000,
      lines: [
        {
          productId: "p1",
          variantId: null,
          productName: "Lápis",
          variantName: null,
          quantity: 1,
          listUnitPriceCents: 1000,
          unitPriceCents: 1000,
          lineTotalCents: 1000,
          lineDiscountCents: 0,
        },
      ],
    });
    expect(message).toContain("Retirada na loja");
    expect(message).toContain("Sem taxa (retirada)");
    expect(message).not.toContain("não deve aparecer");
  });
});
