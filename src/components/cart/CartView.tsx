"use client";

import Link from "next/link";
import { ProductImage } from "@/components/catalog/ProductCard";
import { cartActions, useCartLines } from "@/lib/cart/store";
import { usePricedCart } from "@/lib/cart/use-priced-cart";
import { formatBRL, MAX_QUANTITY_PER_LINE } from "@/lib/commerce/pricing";

export function CartView() {
  const lines = useCartLines();
  const priced = usePricedCart(lines);

  if (priced.status === "empty") {
    return (
      <div className="rounded-md border border-dashed border-borda bg-white p-10 text-center">
        <p className="font-display text-xl font-semibold text-marinho">Seu carrinho está vazio</p>
        <p className="mt-1 text-sm text-muted">Que tal começar pelo catálogo?</p>
        <Link href="/produtos" className="mt-5 inline-block rounded-full bg-marinho px-6 py-3 text-sm font-bold text-papel hover:bg-marinho-texto">
          Ver catálogo
        </Link>
      </div>
    );
  }

  if (priced.status === "loading") {
    return <div className="h-64 animate-pulse rounded-md bg-lilas-soft" aria-busy="true" aria-label="Carregando carrinho" />;
  }

  if (priced.status === "error") {
    return (
      <div role="alert" className="rounded-md border border-rosa bg-rosa-soft p-6 text-marinho">
        Não foi possível carregar o carrinho agora. Atualize a página e tente novamente.
      </div>
    );
  }

  const { data } = priced;
  const canCheckout = !data.hasErrors && data.lines.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <ul className="space-y-3">
        {data.lines.map((line) => {
          const ref = { productId: line.productId, variantId: line.variantId };
          const key = `${line.productId}::${line.variantId ?? ""}`;

          if (!line.ok) {
            return (
              <li key={key} role="alert" className="rounded-md border border-rosa bg-rosa-soft p-4">
                <p className="font-semibold text-marinho">{line.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {line.code === "INSUFFICIENT_STOCK" && line.availableQuantity > 0 && (
                    <button
                      type="button"
                      onClick={() => cartActions.setQuantity(ref, line.availableQuantity)}
                      className="rounded-full bg-marinho px-4 py-1.5 text-sm font-semibold text-papel"
                    >
                      Ajustar para {line.availableQuantity}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => cartActions.remove(ref)}
                    className="rounded-full border border-marinho px-4 py-1.5 text-sm font-semibold text-marinho"
                  >
                    Remover
                  </button>
                </div>
              </li>
            );
          }

          const name = line.variantName ? `${line.productName} (${line.variantName})` : line.productName;
          return (
            <li key={key} className="flex gap-3 rounded-md border border-borda bg-white p-3 shadow-suave">
              <ProductImage url={line.imageUrl} alt={line.productName} className="h-20 w-20 shrink-0 rounded-sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  {line.slug ? (
                    <Link href={`/produto/${line.slug}`} className="font-display font-semibold leading-snug text-marinho hover:underline">
                      {name}
                    </Link>
                  ) : (
                    <span className="font-display font-semibold text-marinho">{name}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => cartActions.remove(ref)}
                    aria-label={`Remover ${name}`}
                    className="shrink-0 rounded-full px-2 text-sm font-semibold text-muted hover:text-marinho"
                  >
                    Remover
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-full border border-borda">
                    <button
                      type="button"
                      aria-label={`Diminuir quantidade de ${name}`}
                      onClick={() => cartActions.setQuantity(ref, line.quantity - 1)}
                      className="h-9 w-9 text-lg font-bold text-marinho"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-marinho">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Aumentar quantidade de ${name}`}
                      onClick={() => cartActions.setQuantity(ref, line.quantity + 1)}
                      disabled={line.quantity >= MAX_QUANTITY_PER_LINE}
                      className="h-9 w-9 text-lg font-bold text-marinho disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-marinho">{formatBRL(line.lineTotalCents)}</p>
                    {line.lineDiscountCents > 0 && (
                      <p className="text-xs text-muted line-through">{formatBRL(line.listUnitPriceCents * line.quantity)}</p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="space-y-3 rounded-md border border-borda bg-white p-5 shadow-suave lg:self-start" aria-label="Resumo do pedido">
        <h2 className="font-display text-lg font-semibold text-marinho">Resumo</h2>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold text-marinho">{formatBRL(data.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Descontos</dt>
            <dd className="font-semibold text-marinho">{data.discountCents > 0 ? `− ${formatBRL(data.discountCents)}` : formatBRL(0)}</dd>
          </div>
          <div className="flex justify-between border-t border-borda pt-2 text-base">
            <dt className="font-bold text-marinho">Total</dt>
            <dd className="font-bold text-marinho">{formatBRL(data.totalCents)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted">Entrega ou retirada você escolhe na próxima etapa. O pedido segue pelo WhatsApp.</p>
        {canCheckout ? (
          <Link href="/checkout" className="block rounded-full bg-marinho px-6 py-3 text-center text-sm font-bold text-papel shadow-suave hover:bg-marinho-texto">
            Finalizar pedido
          </Link>
        ) : (
          <button type="button" disabled className="w-full cursor-not-allowed rounded-full bg-marinho px-6 py-3 text-sm font-bold text-papel opacity-50">
            Resolva os avisos para continuar
          </button>
        )}
        <Link href="/produtos" className="block text-center text-sm font-semibold text-marinho-texto hover:underline">
          Continuar comprando
        </Link>
      </aside>
    </div>
  );
}
