"use client";

import { useSyncExternalStore } from "react";
import { MAX_QUANTITY_PER_LINE } from "@/lib/commerce/pricing";

/**
 * Carrinho no navegador. Guarda SOMENTE ids e quantidades (nunca preços):
 * o servidor recalcula tudo em /api/cart/price e /api/orders.
 */
export interface StoredCartLine {
  productId: string;
  variantId: string | null;
  quantity: number;
}

const STORAGE_KEY = "snp-cart-v1";
const EMPTY: StoredCartLine[] = [];

let cache: StoredCartLine[] | null = null;
const listeners = new Set<() => void>();

function sanitize(value: unknown): StoredCartLine[] {
  if (!Array.isArray(value)) return EMPTY;
  const lines: StoredCartLine[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const { productId, variantId, quantity } = raw as Record<string, unknown>;
    if (typeof productId !== "string" || !productId) continue;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) continue;
    lines.push({
      productId,
      variantId: typeof variantId === "string" && variantId ? variantId : null,
      quantity: Math.min(quantity, MAX_QUANTITY_PER_LINE),
    });
  }
  return lines;
}

function read(): StoredCartLine[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? sanitize(JSON.parse(raw)) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(lines: StoredCartLine[]) {
  cache = lines.length ? lines : EMPTY;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Armazenamento indisponível (modo privado): o carrinho vale só nesta aba.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const keyOf = (l: { productId: string; variantId: string | null }) => `${l.productId}::${l.variantId ?? ""}`;

export const cartActions = {
  add(line: StoredCartLine) {
    const current = read();
    const index = current.findIndex((l) => keyOf(l) === keyOf(line));
    if (index === -1) {
      write([...current, { ...line, quantity: Math.min(line.quantity, MAX_QUANTITY_PER_LINE) }]);
      return;
    }
    const next = [...current];
    next[index] = { ...next[index], quantity: Math.min(next[index].quantity + line.quantity, MAX_QUANTITY_PER_LINE) };
    write(next);
  },
  setQuantity(line: { productId: string; variantId: string | null }, quantity: number) {
    if (quantity < 1) return cartActions.remove(line);
    write(
      read().map((l) =>
        keyOf(l) === keyOf(line) ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY_PER_LINE) } : l,
      ),
    );
  },
  remove(line: { productId: string; variantId: string | null }) {
    write(read().filter((l) => keyOf(l) !== keyOf(line)));
  },
  clear() {
    write(EMPTY);
  },
};

export function useCartLines(): StoredCartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCartCount(): number {
  const lines = useCartLines();
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
