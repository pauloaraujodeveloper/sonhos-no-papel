import Link from "next/link";
import { Suspense } from "react";
import { cardClass } from "@/components/admin/styles";
import { requireAdmin } from "@/lib/auth/guard";
import { formatBRL } from "@/lib/commerce/pricing";
import { formatOrderCode } from "@/lib/commerce/whatsapp";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, type OrderStatusKey, type PaymentStatusKey } from "@/lib/orders/status";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className={cardClass}>
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-marinho">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

async function Dashboard({ denied }: { denied: boolean }) {
  await requireAdmin();
  const [
    totalOrders,
    awaiting,
    confirmed,
    inPreparation,
    completed,
    paidAgg,
    products,
    activeProducts,
    outOfStock,
    lowStock,
    recent,
  ] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: { in: ["NEW", "AWAITING_CONFIRMATION"] } } }),
    db.order.count({ where: { status: "CONFIRMED" } }),
    db.order.count({ where: { status: "IN_PREPARATION" } }),
    db.order.count({ where: { status: "COMPLETED" } }),
    db.order.aggregate({ where: { paymentStatus: "PAID", status: { not: "CANCELLED" } }, _sum: { totalCents: true } }),
    db.product.count({ where: { deletedAt: null } }),
    db.product.count({ where: { deletedAt: null, active: true } }),
    db.product.count({ where: { deletedAt: null, active: true, stockQuantity: { lte: 0 }, variants: { none: {} } } }),
    db.product.findMany({
      where: { deletedAt: null, active: true, variants: { none: {} } },
      select: { stockQuantity: true, lowStockThreshold: true },
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, orderNumber: true, customerName: true, totalCents: true, status: true, paymentStatus: true } }),
  ]);
  const lowCount = lowStock.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length;

  return (
    <div className="space-y-8">
      {denied && (
        <p role="alert" className="rounded-md bg-rosa-soft p-3 text-sm font-semibold text-marinho">
          Seu perfil não tem permissão para acessar essa área.
        </p>
      )}
      <div>
        <h1 className="font-display text-3xl font-semibold text-marinho">Dashboard</h1>
        <p className="text-sm text-muted">Valores de venda consideram apenas pedidos com pagamento confirmado.</p>
      </div>

      <section aria-label="Pedidos" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total de pedidos" value={totalOrders} />
        <Stat label="Novos / aguardando" value={awaiting} hint="Pedidos pelo WhatsApp a confirmar" />
        <Stat label="Confirmados" value={confirmed} />
        <Stat label="Em preparação" value={inPreparation} />
        <Stat label="Concluídos" value={completed} />
        <Stat label="Vendas confirmadas" value={formatBRL(paidAgg._sum.totalCents ?? 0)} hint="Pagamento conferido" />
      </section>

      <section aria-label="Produtos" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Produtos cadastrados" value={products} />
        <Stat label="Produtos ativos" value={activeProducts} />
        <Stat label="Estoque baixo" value={lowCount} />
        <Stat label="Esgotados" value={outOfStock} />
      </section>

      <section aria-labelledby="recentes" className={cardClass}>
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recentes" className="font-display text-lg font-semibold text-marinho">
            Pedidos recentes
          </h2>
          <Link href="/admin/pedidos" className="text-sm font-semibold text-marinho-texto hover:underline">
            Ver todos
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">Nenhum pedido ainda.</p>
        ) : (
          <ul className="divide-y divide-borda">
            {recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-marinho hover:underline">
                  {formatOrderCode(o.orderNumber)} · {o.customerName}
                </Link>
                <span className="text-muted">
                  {ORDER_STATUS_LABEL[o.status as OrderStatusKey]} · {PAYMENT_STATUS_LABEL[o.paymentStatus as PaymentStatusKey]} · {formatBRL(o.totalCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-lilas-soft" aria-busy="true" />}>
      <DashboardWithParams searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardWithParams({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <Dashboard denied={sp.negado === "1"} />;
}
