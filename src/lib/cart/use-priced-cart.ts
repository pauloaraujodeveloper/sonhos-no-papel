"use client";

import { useEffect, useState } from "react";
import type { StoredCartLine } from "./store";

export type PricedLineResponse =
  | {
      ok: true;
      productId: string;
      variantId: string | null;
      productName: string;
      variantName: string | null;
      quantity: number;
      unitPriceCents: number;
      listUnitPriceCents: number;
      lineTotalCents: number;
      lineDiscountCents: number;
      slug: string | null;
      imageUrl: string | null;
    }
  | {
      ok: false;
      productId: string;
      variantId: string | null;
      quantity: number;
      slug: string | null;
      code: string;
      message: string;
      availableQuantity: number;
    };

export interface PricedCartResponse {
  lines: PricedLineResponse[];
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  deliveryAvailable: boolean;
  totalCents: number;
  hasErrors: boolean;
}

export type PricedCartState =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PricedCartResponse };

/**
 * Pede ao servidor o preço atual do carrinho (preços, promoções, estoque e taxa de entrega).
 * Os valores exibidos sempre vêm do servidor, nunca do armazenamento local.
 */
export function usePricedCart(
  lines: StoredCartLine[],
  options: { fulfillment?: "PICKUP" | "DELIVERY"; district?: string } = {},
): PricedCartState {
  const [result, setResult] = useState<{ key: string; state: PricedCartState } | null>(null);
  const key = JSON.stringify({ lines, f: options.fulfillment, d: options.district });

  useEffect(() => {
    if (lines.length === 0) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/cart/price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: lines,
            fulfillment: options.fulfillment,
            district: options.district || null,
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Falha ao consultar o carrinho");
        const data = (await response.json()) as PricedCartResponse;
        setResult({ key, state: { status: "ready", data } });
      } catch (error) {
        if (controller.signal.aborted) return;
        setResult({
          key,
          state: { status: "error", message: error instanceof Error ? error.message : "Erro ao carregar o carrinho" },
        });
      }
    }, options.district ? 350 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // `key` resume lines, fulfillment e district.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (lines.length === 0) return { status: "empty" };
  if (!result || result.key !== key) {
    // Mantém os últimos valores enquanto recalcula, evitando piscar.
    return result?.state.status === "ready" ? result.state : { status: "loading" };
  }
  return result.state;
}
