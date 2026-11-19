import { Suspense } from "react";
import { Flash, Loading, firstParam } from "@/components/admin/Flash";
import { SubmitButton } from "@/components/admin/ui";
import { cardClass, inputClass, labelClass } from "@/components/admin/styles";
import { moveStockAction } from "@/lib/admin/actions/inventory";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";

export const metadata = { title: "Estoque" };
type SP = Promise<Record<string, string | string[] | undefined>>;

const TYPE_LABEL = {
  ENTRY: "Entrada",
  EXIT: "Saída",
  ADJUSTMENT: "Ajuste",
  ORDER_RESERVED: "Reserva de pedido",
  ORDER_RELEASED: "Liberação de pedido",
  ORDER_CONFIRMED: "Baixa de pedido",
} as const;

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

async function Inventory({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;

  const [products, movements] = await Promise.all([
    db.product.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: { variants: { where: { active: true }, orderBy: { name: "asc" } } },
    }),
    db.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { product: { select: { name: true } }, variant: { select: { name: true } }, admin: { select: { name: true } } },
    }),
  ]);

  const items = products.flatMap((p) =>
    p.variants.length
      ? p.variants.map((v) => ({ target: `variant:${v.id}`, label: `${p.name} (${v.name})`, stock: v.stockQuantity, min: p.lowStockThreshold }))
      : [{ target: `product:${p.id}`, label: p.name, stock: p.stockQuantity, min: p.lowStockThreshold }],
  );
  const alerts = items.filter((i) => i.stock <= i.min);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-marinho">Estoque</h1>
      <Flash ok={firstParam(sp.ok)} erro={firstParam(sp.erro)} />

      {alerts.length > 0 && (
        <section className="rounded-md border border-rosa bg-rosa-soft p-4" aria-labelledby="alertas">
          <h2 id="alertas" className="mb-2 font-display text-lg font-semibold text-marinho">Alertas de estoque</h2>
          <ul className="space-y-1 text-sm text-marinho">
            {alerts.map((a) => (
              <li key={a.target}>{a.label}: <strong>{a.stock === 0 ? "esgotado" : `${a.stock} un. (mínimo ${a.min})`}</strong></li>
            ))}
          </ul>
        </section>
      )}

      <section className={cardClass} aria-labelledby="mov">
        <h2 id="mov" className="mb-3 font-display text-lg font-semibold text-marinho">Registrar movimentação</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">Cadastre produtos para movimentar o estoque.</p>
        ) : (
          <form action={moveStockAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_2fr_auto] lg:items-end">
            <div>
              <label htmlFor="target" className={labelClass}>Item</label>
              <select id="target" name="target" required defaultValue="" className={inputClass}>
                <option value="" disabled>Escolha…</option>
                {items.map((i) => <option key={i.target} value={i.target}>{i.label} — estoque {i.stock}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="type" className={labelClass}>Tipo</label>
              <select id="type" name="type" className={inputClass} defaultValue="ENTRY">
                <option value="ENTRY">Entrada</option>
                <option value="EXIT">Saída</option>
                <option value="ADJUSTMENT">Ajuste (define o total)</option>
              </select>
            </div>
            <div>
              <label htmlFor="quantity" className={labelClass}>Quantidade</label>
              <input id="quantity" name="quantity" type="number" min={0} required className={inputClass} />
            </div>
            <div>
              <label htmlFor="reason" className={labelClass}>Motivo</label>
              <input id="reason" name="reason" maxLength={200} placeholder="Ex.: compra do fornecedor" className={inputClass} />
            </div>
            <SubmitButton pendingLabel="Registrando…">Registrar</SubmitButton>
          </form>
        )}
      </section>

      <section className={cardClass} aria-labelledby="hist">
        <h2 id="hist" className="mb-3 font-display text-lg font-semibold text-marinho">Histórico recente</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma movimentação ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted">
                  <th className="pb-2 pr-3">Data</th><th className="pb-2 pr-3">Item</th><th className="pb-2 pr-3">Tipo</th><th className="pb-2 pr-3 text-right">Qtd</th><th className="pb-2 pr-3 text-right">Saldo</th><th className="pb-2">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 pr-3 whitespace-nowrap text-muted">{dateFmt.format(m.createdAt)}</td>
                    <td className="py-2 pr-3 text-marinho">{m.variant ? `${m.product.name} (${m.variant.name})` : m.product.name}</td>
                    <td className="py-2 pr-3">{TYPE_LABEL[m.type]}</td>
                    <td className="py-2 pr-3 text-right">{m.quantity}</td>
                    <td className="py-2 pr-3 text-right font-semibold text-marinho">{m.balanceAfter}</td>
                    <td className="py-2 text-muted">{m.reason ?? "—"}{m.admin ? ` · ${m.admin.name}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function Page({ searchParams }: { searchParams: SP }) {
  return <Suspense fallback={<Loading />}><Inventory searchParams={searchParams} /></Suspense>;
}
