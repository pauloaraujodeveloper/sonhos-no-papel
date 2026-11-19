"use client";

import Link from "next/link";
import { useState } from "react";
import { cartActions, useCartLines } from "@/lib/cart/store";
import { usePricedCart } from "@/lib/cart/use-priced-cart";
import { BRAND } from "@/lib/brand";
import { formatBRL } from "@/lib/commerce/pricing";

type Fulfillment = "PICKUP" | "DELIVERY";

interface CreatedOrderResponse {
  orderCode: string;
  totalCents: number;
  whatsappUrl: string;
}

const field =
  "w-full rounded-md border border-borda bg-white px-3 py-2 text-sm text-marinho focus:border-rosa focus:outline-none";
const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-muted";

export function CheckoutView() {
  const lines = useCartLines();
  const [fulfillment, setFulfillment] = useState<Fulfillment>("PICKUP");
  const [district, setDistrict] = useState("");
  const priced = usePricedCart(lines, { fulfillment, district });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<CreatedOrderResponse | null>(null);

  if (created) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-lg border border-borda bg-white p-8 text-center shadow-suave" role="status">
        <p className="text-sm font-bold uppercase tracking-widest text-muted">Pedido registrado</p>
        <h2 className="font-display text-3xl font-semibold text-marinho">{created.orderCode}</h2>
        <p className="text-muted">
          Total {formatBRL(created.totalCents)}. Falta só um passo: envie a mensagem no WhatsApp. Por lá você confirma a
          disponibilidade e recebe a chave ou o QR Code Pix. O pedido só é confirmado depois dessa conversa.
        </p>
        <a
          href={created.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full bg-marinho px-6 py-3 text-sm font-bold text-papel shadow-suave hover:bg-marinho-texto"
        >
          Abrir WhatsApp
        </a>
        <p>
          <Link href="/produtos" className="text-sm font-semibold text-marinho-texto hover:underline">
            Voltar à loja
          </Link>
        </p>
      </div>
    );
  }

  if (priced.status === "empty") {
    return (
      <div className="rounded-md border border-dashed border-borda bg-white p-10 text-center">
        <p className="font-display text-xl font-semibold text-marinho">Seu carrinho está vazio</p>
        <Link href="/produtos" className="mt-5 inline-block rounded-full bg-marinho px-6 py-3 text-sm font-bold text-papel hover:bg-marinho-texto">
          Ver produtos
        </Link>
      </div>
    );
  }

  const data = priced.status === "ready" ? priced.data : null;
  const blocked = !data || data.hasErrors || (fulfillment === "DELIVERY" && !data.deliveryAvailable);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();

    const body = {
      customerName: text("customerName"),
      customerPhone: text("customerPhone"),
      fulfillment,
      notes: text("notes") || null,
      address:
        fulfillment === "DELIVERY"
          ? {
              cep: text("cep"),
              street: text("street"),
              number: text("number"),
              district: text("district"),
              city: text("city"),
              complement: text("complement") || null,
              reference: text("reference") || null,
            }
          : null,
      items: lines,
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await response.json();

      if (response.status === 201) {
        cartActions.clear();
        setCreated(json as CreatedOrderResponse);
        // Encaminha ao WhatsApp. Abrir a conversa não confirma o envio da mensagem.
        window.location.assign((json as CreatedOrderResponse).whatsappUrl);
        return;
      }

      if (response.status === 422 && Array.isArray(json.issues)) {
        const next: Record<string, string> = {};
        for (const issue of json.issues as { path: (string | number)[]; message: string }[]) {
          const key = issue.path[issue.path.length - 1];
          if (typeof key === "string" && !next[key]) next[key] = issue.message;
        }
        setFieldErrors(next);
        setError("Confira os campos destacados.");
      } else if (json.code === "INVALID_CART") {
        setError("Alguns itens do carrinho não estão mais disponíveis. Revise o carrinho.");
      } else {
        setError(json.error ?? "Não foi possível finalizar o pedido. Tente novamente.");
      }
    } catch {
      setError("Sem conexão no momento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const err = (name: string) =>
    fieldErrors[name] ? (
      <p className="mt-1 text-xs font-semibold text-marinho" role="alert">
        {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_20rem]" noValidate>
      <div className="space-y-6">
        <fieldset className="space-y-3 rounded-md border border-borda bg-white p-5 shadow-suave">
          <legend className="px-1 font-display text-lg font-semibold text-marinho">Seus dados</legend>
          <div>
            <label htmlFor="customerName" className={label}>
              Nome completo
            </label>
            <input id="customerName" name="customerName" autoComplete="name" required className={field} />
            {err("customerName")}
          </div>
          <div>
            <label htmlFor="customerPhone" className={label}>
              WhatsApp
            </label>
            <input id="customerPhone" name="customerPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 91234-5678" required className={field} />
            {err("customerPhone")}
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-md border border-borda bg-white p-5 shadow-suave">
          <legend className="px-1 font-display text-lg font-semibold text-marinho">Recebimento</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                { value: "PICKUP", title: "Retirar na loja", text: "Sem taxa de entrega" },
                { value: "DELIVERY", title: "Entrega", text: "Informe o endereço" },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-md border p-3 transition-colors ${
                  fulfillment === option.value ? "border-marinho bg-lilas-soft" : "border-borda bg-white hover:bg-bebe-soft"
                }`}
              >
                <input
                  type="radio"
                  name="fulfillment"
                  value={option.value}
                  checked={fulfillment === option.value}
                  onChange={() => setFulfillment(option.value)}
                  className="sr-only"
                />
                <span className="block font-semibold text-marinho">{option.title}</span>
                <span className="block text-xs text-muted">{option.text}</span>
              </label>
            ))}
          </div>

          {fulfillment === "DELIVERY" && (
            <div className="grid gap-3 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label htmlFor="cep" className={label}>
                  CEP
                </label>
                <input id="cep" name="cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" className={field} />
                {err("cep")}
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="street" className={label}>
                  Rua
                </label>
                <input id="street" name="street" autoComplete="address-line1" className={field} />
                {err("street")}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="number" className={label}>
                  Número
                </label>
                <input id="number" name="number" className={field} />
                {err("number")}
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="district" className={label}>
                  Bairro
                </label>
                <input id="district" name="district" value={district} onChange={(e) => setDistrict(e.target.value)} className={field} />
                {err("district")}
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="city" className={label}>
                  Cidade
                </label>
                <input id="city" name="city" autoComplete="address-level2" className={field} />
                {err("city")}
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="complement" className={label}>
                  Complemento (opcional)
                </label>
                <input id="complement" name="complement" className={field} />
              </div>
              <div className="sm:col-span-6">
                <label htmlFor="reference" className={label}>
                  Ponto de referência (opcional)
                </label>
                <input id="reference" name="reference" className={field} />
              </div>
            </div>
          )}
        </fieldset>

        <div>
          <label htmlFor="notes" className={label}>
            Observações (opcional)
          </label>
          <textarea id="notes" name="notes" rows={3} maxLength={500} className={field} />
        </div>
      </div>

      <aside className="space-y-3 rounded-md border border-borda bg-white p-5 shadow-suave lg:self-start" aria-label="Resumo do pedido">
        <h2 className="font-display text-lg font-semibold text-marinho">Resumo</h2>
        {!data ? (
          <div className="h-32 animate-pulse rounded bg-lilas-soft" aria-busy="true" />
        ) : (
          <>
            <ul className="space-y-1 text-sm">
              {data.lines.map((l) =>
                l.ok ? (
                  <li key={`${l.productId}::${l.variantId ?? ""}`} className="flex justify-between gap-2">
                    <span className="text-marinho-texto">
                      {l.quantity}× {l.variantName ? `${l.productName} (${l.variantName})` : l.productName}
                    </span>
                    <span className="font-semibold text-marinho">{formatBRL(l.lineTotalCents)}</span>
                  </li>
                ) : (
                  <li key={`${l.productId}::${l.variantId ?? ""}`} className="font-semibold text-marinho" role="alert">
                    {l.message}
                  </li>
                ),
              )}
            </ul>
            <dl className="space-y-1.5 border-t border-borda pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold text-marinho">{formatBRL(data.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Descontos</dt>
                <dd className="font-semibold text-marinho">{data.discountCents > 0 ? `− ${formatBRL(data.discountCents)}` : formatBRL(0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Entrega</dt>
                <dd className="font-semibold text-marinho">
                  {fulfillment === "PICKUP" ? "Retirada" : data.deliveryAvailable ? formatBRL(data.deliveryFeeCents) : "Indisponível"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-borda pt-2 text-base">
                <dt className="font-bold text-marinho">Total</dt>
                <dd className="font-bold text-marinho">{formatBRL(data.totalCents)}</dd>
              </div>
            </dl>
            {fulfillment === "DELIVERY" && !data.deliveryAvailable && (
              <p className="text-xs font-semibold text-marinho" role="alert">
                Ainda não entregamos nessa região. Escolha retirada na loja.
              </p>
            )}
          </>
        )}

        {error && (
          <p className="rounded-md bg-rosa-soft p-3 text-sm font-semibold text-marinho" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={blocked || submitting}
          className="w-full rounded-full bg-marinho px-6 py-3 text-sm font-bold text-papel shadow-suave transition-colors hover:bg-marinho-texto disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Enviando…" : "Finalizar pedido pelo WhatsApp"}
        </button>
        <p className="text-xs text-muted">{BRAND.payment}</p>
        <Link href="/carrinho" className="block text-center text-sm font-semibold text-marinho-texto hover:underline">
          Voltar ao carrinho
        </Link>
      </aside>
    </form>
  );
}
