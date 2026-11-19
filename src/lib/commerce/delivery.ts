/**
 * Cálculo de entrega e retirada (PRD RF-010 e RN-010).
 * Função pura: o valor é sempre calculado no servidor, a partir das configurações.
 */

export type FulfillmentType = "PICKUP" | "DELIVERY";

export interface DeliveryZoneRule {
  name: string;
  feeCents: number;
  freeAboveCents: number | null;
}

export interface DeliveryFallbackRule {
  feeCents: number;
  freeAboveCents: number | null;
}

export interface DeliveryQuoteInput {
  fulfillment: FulfillmentType;
  subtotalCents: number;
  /** Zona de entrega que atende o endereço (escolhida pelo bairro cadastrado). */
  zone: DeliveryZoneRule | null;
  /** Regra geral usada quando não há zona específica. Null = região não atendida. */
  fallback: DeliveryFallbackRule | null;
}

export type DeliveryQuote =
  | { ok: true; feeCents: number; reason: "PICKUP" | "ZONE" | "FALLBACK" | "FREE_ABOVE_THRESHOLD" }
  | { ok: false; code: "AREA_NOT_SERVED" };

export function quoteFulfillment(input: DeliveryQuoteInput): DeliveryQuote {
  if (input.fulfillment === "PICKUP") {
    return { ok: true, feeCents: 0, reason: "PICKUP" };
  }

  const rule: DeliveryFallbackRule | null = input.zone
    ? { feeCents: input.zone.feeCents, freeAboveCents: input.zone.freeAboveCents }
    : input.fallback;

  if (!rule) {
    return { ok: false, code: "AREA_NOT_SERVED" };
  }

  if (rule.freeAboveCents !== null && input.subtotalCents >= rule.freeAboveCents) {
    return { ok: true, feeCents: 0, reason: "FREE_ABOVE_THRESHOLD" };
  }

  return { ok: true, feeCents: rule.feeCents, reason: input.zone ? "ZONE" : "FALLBACK" };
}
