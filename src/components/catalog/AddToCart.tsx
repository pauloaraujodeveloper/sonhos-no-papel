"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cartActions, useCartLines } from "@/lib/cart/store";
import { formatBRL, MAX_QUANTITY_PER_LINE } from "@/lib/commerce/pricing";

interface Variant {
  id: string;
  name: string;
  priceCents: number;
  availableQuantity: number;
}

export function AddToCart({
  productId,
  variants,
  availableQuantity,
}: {
  productId: string;
  variants: Variant[];
  availableQuantity: number;
}) {
  const router = useRouter();
  const lines = useCartLines();
  const [variantId, setVariantId] = useState<string | null>(variants.find((v) => v.availableQuantity > 0)?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const hasVariants = variants.length > 0;
  const selected = hasVariants ? variants.find((v) => v.id === variantId) : undefined;
  const stock = hasVariants ? (selected?.availableQuantity ?? 0) : availableQuantity;
  const inCart = lines.find((l) => l.productId === productId && l.variantId === (variantId ?? null))?.quantity ?? 0;
  const remaining = Math.max(0, Math.min(stock - inCart, MAX_QUANTITY_PER_LINE - inCart));
  const soldOut = stock <= 0;
  const maxReached = !soldOut && remaining <= 0;
  const safeQuantity = Math.min(Math.max(1, quantity), Math.max(1, remaining));

  function addToCart(): boolean {
    if (soldOut || remaining <= 0) return false;
    cartActions.add({ productId, variantId: variantId ?? null, quantity: safeQuantity });
    setQuantity(1);
    return true;
  }

  function handleAdd() {
    if (addToCart()) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 2000);
    }
  }

  function handleBuyNow() {
    if (addToCart()) router.push("/carrinho");
    else if (inCart > 0) router.push("/carrinho");
  }

  return (
    <div className="space-y-4">
      {hasVariants && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-marinho">Variação</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const disabled = v.availableQuantity <= 0;
              const checked = v.id === variantId;
              return (
                <label
                  key={v.id}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    checked ? "border-marinho bg-marinho text-papel" : "border-borda bg-white text-marinho-texto hover:bg-bebe-soft"
                  } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={v.id}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => {
                      setVariantId(v.id);
                      setQuantity(1);
                    }}
                    className="sr-only"
                  />
                  {v.name} · {formatBRL(v.priceCents)}
                  {disabled && " (esgotado)"}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {!soldOut && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-marinho">Quantidade</span>
          <div className="flex items-center rounded-full border border-borda bg-white">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() => setQuantity(Math.max(1, safeQuantity - 1))}
              disabled={safeQuantity <= 1}
              className="h-10 w-10 rounded-full text-lg font-bold text-marinho disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-bold text-marinho" aria-live="polite">
              {safeQuantity}
            </span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => setQuantity(Math.min(remaining, safeQuantity + 1))}
              disabled={safeQuantity >= remaining}
              className="h-10 w-10 rounded-full text-lg font-bold text-marinho disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut || remaining <= 0}
          className="flex-1 rounded-full bg-marinho px-6 py-3 text-sm font-bold text-papel shadow-suave transition-colors hover:bg-marinho-texto disabled:cursor-not-allowed disabled:opacity-50"
        >
          {soldOut ? "Esgotado" : justAdded ? "Adicionado ✓" : "Adicionar ao carrinho"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={soldOut || (remaining <= 0 && inCart === 0)}
          className="flex-1 rounded-full border border-marinho px-6 py-3 text-sm font-bold text-marinho transition-colors hover:bg-lilas-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Comprar agora
        </button>
      </div>

      <p className="min-h-5 text-sm text-muted" aria-live="polite">
        {justAdded && "Produto adicionado ao carrinho."}
        {!justAdded && maxReached && "Você já tem a quantidade máxima disponível no carrinho."}
        {!justAdded && !soldOut && !maxReached && inCart > 0 && `${inCart} no carrinho.`}
      </p>
    </div>
  );
}
