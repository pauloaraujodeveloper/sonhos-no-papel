import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Suspense } from "react";
import { SubmitButton } from "@/components/admin/ui";
import { buttonClass, cardClass, inputClass, labelClass } from "@/components/admin/styles";
import { confirmPaymentAction } from "@/lib/admin/actions/orders";
import { requireAdmin } from "@/lib/auth/guard";
import { formatBRL } from "@/lib/commerce/pricing";
import { buildOwnerReplyMessage, buildWhatsAppUrl, formatOrderCode } from "@/lib/commerce/whatsapp";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, type OrderStatusKey, type PaymentStatusKey } from "@/lib/orders/status";

export const metadata = { title: "Pedidos" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const PAGE_SIZE = 20;

async function Orders({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const status = first(sp.status);
  const pagamento = first(sp.pagamento);
  const de = first(sp.de);
  const ate = first(sp.ate);
  const pagina = Math.max(1, Number.parseInt(first(sp.pagina) || "1", 10) || 1);

  const where: Prisma.OrderWhereInput = {};
  if (status === "novos") where.status = { in: ["NEW", "AWAITING_CONFIRMATION"] };
  else if (status in ORDER_STATUS_LABEL) where.status = status as OrderStatusKey;
  if (pagamento in PAYMENT_STATUS_LABEL) where.paymentStatus = pagamento as PaymentStatusKey;
  if (q) {
    const digits = q.replace(/\D/g, "");
    const number = Number.parseInt(q.replace(/^sp-?/i, ""), 10);
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      ...(digits.length >= 4 ? [{ customerPhone: { contains: digits } }] : []),
      ...(Number.isFinite(number) && /^(sp-?)?\d+$/i.test(q) ? [{ orderNumber: number }] : []),
    ];
  }
  const createdAt: Prisma.DateTimeFilter = {};
  if (/^\d{4}-\d{2}-\d{2}$/.test(de)) createdAt.gte = new Date(`${de}T00:00:00-03:00`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ate)) createdAt.lte = new Date(`${ate}T23:59:59-03:00`);
  if (createdAt.gte || createdAt.lte) where.createdAt = createdAt;

  const [total, orders, settings] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (pagina - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.storeSettings.findUnique({ where: { id: "default" } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qs = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, status, pagamento, de, ate })) if (v) p.set(k, v);
    if (page > 1) p.set("pagina", String(page));
    const s = p.toString();
    return s ? `/admin/pedidos?${s}` : "/admin/pedidos";
  };
  const currentUrl = qs(pagina);
  const tabs = [
    { value: "", label: "Todos" },
    { value: "novos", label: "Novos" },
    { value: "CONFIRMED", label: "Confirmados" },
    { value: "IN_PREPARATION", label: "Em preparação" },
    { value: "COMPLETED", label: "Concluídos" },
    { value: "CANCELLED", label: "Cancelados" },
  ];
  const flashOk = first(sp.ok);
  const flashErr = first(sp.erro);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-marinho">Pedidos</h1>

      {flashOk && <p role="status" className="rounded-md bg-bebe-soft p-3 text-sm font-semibold text-marinho">{flashOk}</p>}
      {flashErr && <p role="alert" className="rounded-md bg-rosa-soft p-3 text-sm font-semibold text-marinho">{flashErr}</p>}

      <nav aria-label="Filtro rápido" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={t.value ? `/admin/pedidos?status=${t.value}` : "/admin/pedidos"}
            aria-current={status === t.value ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status === t.value ? "bg-marinho text-papel" : "border border-borda bg-white text-marinho-texto hover:bg-lilas-soft"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <form method="get" className={`${cardClass} grid gap-3 sm:grid-cols-2 lg:grid-cols-5`}>
        <input type="hidden" name="status" value={status} />
        <div className="lg:col-span-2">
          <label htmlFor="q" className={labelClass}>Cliente, telefone ou nº do pedido</label>
          <input id="q" name="q" defaultValue={q} className={inputClass} placeholder="Maria, 1191234 ou SP-0001" />
        </div>
        <div>
          <label htmlFor="pagamento" className={labelClass}>Pagamento</label>
          <select id="pagamento" name="pagamento" defaultValue={pagamento} className={inputClass}>
            <option value="">Todos</option>
            {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="de" className={labelClass}>De</label>
          <input id="de" name="de" type="date" defaultValue={de} className={inputClass} />
        </div>
        <div>
          <label htmlFor="ate" className={labelClass}>Até</label>
          <input id="ate" name="ate" type="date" defaultValue={ate} className={inputClass} />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" className={buttonClass("primary", true)}>Filtrar</button>
          <Link href="/admin/pedidos" className={buttonClass("secondary", true)}>Limpar</Link>
          <span className="ml-auto text-sm text-muted">{total} {total === 1 ? "pedido" : "pedidos"}</span>
        </div>
      </form>

      {orders.length === 0 ? (
        <div className="rounded-md border border-dashed border-borda bg-white p-10 text-center text-muted">Nenhum pedido encontrado.</div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const needsAction = o.status === "NEW" || o.status === "AWAITING_CONFIRMATION";
            const waMessage = buildOwnerReplyMessage({
              orderNumber: o.orderNumber,
              customerName: o.customerName,
              totalCents: o.totalCents,
              pix: settings?.pixKey ? { key: settings.pixKey, receiverName: settings.pixReceiverName, bankName: settings.pixBankName } : null,
            });
            return (
              <li key={o.id} className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/admin/pedidos/${o.id}`} className="font-display text-lg font-semibold text-marinho hover:underline">
                      {formatOrderCode(o.orderNumber)} · {o.customerName}
                    </Link>
                    <p className="text-sm text-muted">
                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(o.createdAt)} ·{" "}
                      {o.fulfillmentType === "DELIVERY" ? "Entrega" : "Retirada"} · {formatBRL(o.totalCents)}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-2 text-xs font-bold">
                      <span className="rounded-full bg-lilas-soft px-2.5 py-0.5 text-marinho">{ORDER_STATUS_LABEL[o.status as OrderStatusKey]}</span>
                      <span className="rounded-full bg-bebe-soft px-2.5 py-0.5 text-marinho">{PAYMENT_STATUS_LABEL[o.paymentStatus as PaymentStatusKey]}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={buildWhatsAppUrl(o.customerPhone, waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass("secondary", true)}
                    >
                      Abrir WhatsApp
                    </a>
                    {needsAction && o.paymentStatus !== "PAID" && (
                      <form action={confirmPaymentAction.bind(null, o.id)}>
                        <input type="hidden" name="returnTo" value={currentUrl} />
                        <SubmitButton small pendingLabel="Confirmando…" confirm={`Confirmar o recebimento do Pix de ${formatBRL(o.totalCents)} para o pedido ${formatOrderCode(o.orderNumber)}? O estoque será baixado.`}>
                          Marcar pagamento confirmado
                        </SubmitButton>
                      </form>
                    )}
                    <Link href={`/admin/pedidos/${o.id}`} className={buttonClass("secondary", true)}>Detalhes</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pageCount > 1 && (
        <nav aria-label="Paginação" className="flex items-center justify-center gap-3 text-sm">
          {pagina > 1 && <Link href={qs(pagina - 1)} className={buttonClass("secondary", true)}>Anterior</Link>}
          <span className="text-muted">Página {pagina} de {pageCount}</span>
          {pagina < pageCount && <Link href={qs(pagina + 1)} className={buttonClass("secondary", true)}>Próxima</Link>}
        </nav>
      )}
    </div>
  );
}

export default function PedidosPage({ searchParams }: { searchParams: SP }) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-lilas-soft" aria-busy="true" />}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}
