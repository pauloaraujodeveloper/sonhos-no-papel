import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SubmitButton } from "@/components/admin/ui";
import { buttonClass, cardClass, inputClass, labelClass } from "@/components/admin/styles";
import {
  addOrderNoteAction,
  changeStatusAction,
  confirmPaymentAction,
  setPaymentStatusAction,
} from "@/lib/admin/actions/orders";
import { requireAdmin } from "@/lib/auth/guard";
import { formatBRL } from "@/lib/commerce/pricing";
import { buildOwnerReplyMessage, buildWhatsAppUrl, formatOrderCode } from "@/lib/commerce/whatsapp";
import { db } from "@/lib/db";
import {
  MANUAL_PAYMENT_STATUSES,
  ORDER_STATUS_LABEL,
  ORDER_TRANSITIONS,
  PAYMENT_STATUS_LABEL,
  type OrderStatusKey,
  type PaymentStatusKey,
} from "@/lib/orders/status";

type SP = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true } } } },
        paymentHistory: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true } } } },
      },
    }),
    db.storeSettings.findUnique({ where: { id: "default" } }),
  ]);
  if (!order) notFound();

  const status = order.status as OrderStatusKey;
  const payStatus = order.paymentStatus as PaymentStatusKey;
  const nextStatuses = ORDER_TRANSITIONS[status];
  const canConfirmPayment = status !== "CANCELLED" && payStatus !== "PAID";
  const waUrl = buildWhatsAppUrl(
    order.customerPhone,
    buildOwnerReplyMessage({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      totalCents: order.totalCents,
      pix: settings?.pixKey ? { key: settings.pixKey, receiverName: settings.pixReceiverName, bankName: settings.pixBankName } : null,
    }),
  );
  const flashOk = first(sp.ok);
  const flashErr = first(sp.erro);
  const code = formatOrderCode(order.orderNumber);
  const address = [order.deliveryStreet && `${order.deliveryStreet}, ${order.deliveryNumber}`, order.deliveryComplement, order.deliveryDistrict, order.deliveryCity, order.deliveryCep && `CEP ${order.deliveryCep}`]
    .filter(Boolean)
    .join(" - ");

  const timeline = [
    ...order.statusHistory.map((h) => ({
      at: h.createdAt,
      text:
        h.fromStatus === h.toStatus
          ? `Observação`
          : `Pedido: ${h.fromStatus ? ORDER_STATUS_LABEL[h.fromStatus as OrderStatusKey] + " → " : ""}${ORDER_STATUS_LABEL[h.toStatus as OrderStatusKey]}`,
      by: h.actorType === "CUSTOMER" ? "Cliente" : (h.admin?.name ?? "Sistema"),
      note: h.note,
    })),
    ...order.paymentHistory.map((h) => ({
      at: h.createdAt,
      text: `Pagamento: ${h.fromStatus ? PAYMENT_STATUS_LABEL[h.fromStatus as PaymentStatusKey] + " → " : ""}${PAYMENT_STATUS_LABEL[h.toStatus as PaymentStatusKey]}`,
      by: h.admin?.name ?? "Sistema",
      note: h.note,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/pedidos" className="text-sm font-semibold text-marinho-texto hover:underline">← Pedidos</Link>
          <h1 className="font-display text-3xl font-semibold text-marinho">{code} · {order.customerName}</h1>
          <p className="text-sm text-muted">
            {dateFmt.format(order.createdAt)} · {order.fulfillmentType === "DELIVERY" ? "Entrega" : "Retirada na loja"}
          </p>
        </div>
        <p className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-lilas-soft px-3 py-1 text-marinho">{ORDER_STATUS_LABEL[status]}</span>
          <span className="rounded-full bg-bebe-soft px-3 py-1 text-marinho">{PAYMENT_STATUS_LABEL[payStatus]}</span>
        </p>
      </div>

      {flashOk && <p role="status" className="rounded-md bg-bebe-soft p-3 text-sm font-semibold text-marinho">{flashOk}</p>}
      {flashErr && <p role="alert" className="rounded-md bg-rosa-soft p-3 text-sm font-semibold text-marinho">{flashErr}</p>}

      <section className={`${cardClass} flex flex-wrap items-center gap-3`} aria-label="Ações rápidas">
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>Abrir conversa no WhatsApp</a>
        {canConfirmPayment && (
          <form action={confirmPaymentAction.bind(null, order.id)} className="flex flex-wrap items-center gap-2">
            <input name="note" placeholder="Observação (opcional)" maxLength={300} className={`${inputClass} w-56`} aria-label="Observação do pagamento" />
            <SubmitButton pendingLabel="Confirmando…" confirm={`Confirmar o recebimento do Pix de ${formatBRL(order.totalCents)}? O pedido será confirmado e o estoque baixado.`}>
              Marcar pagamento confirmado
            </SubmitButton>
          </form>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className={cardClass} aria-labelledby="itens">
            <h2 id="itens" className="mb-3 font-display text-lg font-semibold text-marinho">Itens</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted">
                  <th className="pb-2">Produto</th><th className="pb-2 text-right">Qtd</th><th className="pb-2 text-right">Unitário</th><th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 text-marinho">{i.variantName ? `${i.productName} (${i.variantName})` : i.productName}</td>
                    <td className="py-2 text-right">{i.quantity}</td>
                    <td className="py-2 text-right">{formatBRL(i.unitPriceCents)}</td>
                    <td className="py-2 text-right font-semibold text-marinho">{formatBRL(i.lineTotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-1 border-t border-borda pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatBRL(order.subtotalCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Descontos</dt><dd>{order.discountCents > 0 ? `− ${formatBRL(order.discountCents)}` : formatBRL(0)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Entrega</dt><dd>{formatBRL(order.deliveryFeeCents)}</dd></div>
              <div className="flex justify-between text-base font-bold text-marinho"><dt>Total</dt><dd>{formatBRL(order.totalCents)}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-muted">Preços preservados do momento do pedido.</p>
          </section>

          <section className={cardClass} aria-labelledby="historico">
            <h2 id="historico" className="mb-3 font-display text-lg font-semibold text-marinho">Histórico</h2>
            <ol className="space-y-3 text-sm">
              {timeline.map((t, i) => (
                <li key={i} className="border-l-2 border-lilas pl-3">
                  <p className="font-semibold text-marinho">{t.text}</p>
                  <p className="text-xs text-muted">{dateFmt.format(t.at)} · {t.by}</p>
                  {t.note && <p className="text-muted">{t.note}</p>}
                </li>
              ))}
            </ol>
            <form action={addOrderNoteAction.bind(null, order.id)} className="mt-4 flex flex-wrap gap-2">
              <label htmlFor="nota" className="sr-only">Nova observação</label>
              <input id="nota" name="note" maxLength={500} placeholder="Registrar observação interna" className={`${inputClass} flex-1`} />
              <SubmitButton variant="secondary" small>Adicionar</SubmitButton>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className={cardClass} aria-labelledby="cliente">
            <h2 id="cliente" className="mb-2 font-display text-lg font-semibold text-marinho">Cliente</h2>
            <p className="text-sm font-semibold text-marinho">{order.customerName}</p>
            <p className="text-sm text-muted">+{order.customerPhone}</p>
            {order.fulfillmentType === "DELIVERY" && (
              <p className="mt-2 text-sm text-muted">
                <span className="font-semibold text-marinho">Endereço: </span>{address || "—"}
                {order.deliveryReference && <><br />Ref.: {order.deliveryReference}</>}
              </p>
            )}
            {order.notes && <p className="mt-2 text-sm text-muted"><span className="font-semibold text-marinho">Observações do cliente: </span>{order.notes}</p>}
          </section>

          {nextStatuses.length > 0 && (
            <section className={cardClass} aria-labelledby="status">
              <h2 id="status" className="mb-2 font-display text-lg font-semibold text-marinho">Atualizar pedido</h2>
              <div className="flex flex-col gap-2">
                {nextStatuses.map((to) => (
                  <form key={to} action={changeStatusAction.bind(null, order.id)}>
                    <input type="hidden" name="to" value={to} />
                    <SubmitButton
                      variant={to === "CANCELLED" ? "danger" : "secondary"}
                      small
                      confirm={
                        to === "CANCELLED"
                          ? `Cancelar o pedido ${code}? As reservas e baixas de estoque serão desfeitas.`
                          : to === "CONFIRMED"
                            ? `Confirmar o pedido ${code}? O estoque será baixado.`
                            : undefined
                      }
                    >
                      {to === "CANCELLED" ? "Cancelar pedido" : ORDER_STATUS_LABEL[to]}
                    </SubmitButton>
                  </form>
                ))}
              </div>
            </section>
          )}

          {status !== "CANCELLED" && (
            <section className={cardClass} aria-labelledby="pagamento">
              <h2 id="pagamento" className="mb-2 font-display text-lg font-semibold text-marinho">Pagamento</h2>
              {payStatus === "PAID" ? (
                <p className="text-sm text-muted">Pagamento confirmado. Só é possível estornar.</p>
              ) : null}
              <form action={setPaymentStatusAction.bind(null, order.id)} className="space-y-2">
                <label htmlFor="to" className={labelClass}>Registrar situação</label>
                <select id="to" name="to" className={inputClass} defaultValue="">
                  <option value="" disabled>Escolha…</option>
                  {MANUAL_PAYMENT_STATUSES.filter((s) => (payStatus === "PAID" ? s === "REFUNDED" : true)).map((s) => (
                    <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <SubmitButton variant="secondary" small>Salvar</SubmitButton>
              </form>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function PedidoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-lilas-soft" aria-busy="true" />}>
      <OrderDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}
