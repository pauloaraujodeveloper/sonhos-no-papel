import { describe, expect, it } from "vitest";
import { quoteFulfillment } from "./delivery";

const zoneCentro = { name: "Centro", feeCents: 800, freeAboveCents: 15000 };
const fallback = { feeCents: 1500, freeAboveCents: null };

describe("quoteFulfillment", () => {
  it("retirada na loja não cobra taxa", () => {
    const quote = quoteFulfillment({
      fulfillment: "PICKUP",
      subtotalCents: 7000,
      zone: null,
      fallback: null,
    });
    expect(quote).toEqual({ ok: true, feeCents: 0, reason: "PICKUP" });
  });

  it("usa a taxa da zona quando o bairro está cadastrado", () => {
    const quote = quoteFulfillment({
      fulfillment: "DELIVERY",
      subtotalCents: 7000,
      zone: zoneCentro,
      fallback,
    });
    expect(quote).toEqual({ ok: true, feeCents: 800, reason: "ZONE" });
  });

  it("entrega grátis a partir do valor configurado na zona", () => {
    const quote = quoteFulfillment({
      fulfillment: "DELIVERY",
      subtotalCents: 15000,
      zone: zoneCentro,
      fallback,
    });
    expect(quote).toEqual({ ok: true, feeCents: 0, reason: "FREE_ABOVE_THRESHOLD" });
  });

  it("usa a regra geral quando não há zona específica", () => {
    const quote = quoteFulfillment({
      fulfillment: "DELIVERY",
      subtotalCents: 3000,
      zone: null,
      fallback,
    });
    expect(quote).toEqual({ ok: true, feeCents: 1500, reason: "FALLBACK" });
  });

  it("recusa entrega quando a região não é atendida", () => {
    const quote = quoteFulfillment({
      fulfillment: "DELIVERY",
      subtotalCents: 3000,
      zone: null,
      fallback: null,
    });
    expect(quote).toEqual({ ok: false, code: "AREA_NOT_SERVED" });
  });
});
