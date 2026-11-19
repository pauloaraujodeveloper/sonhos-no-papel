import Link from "next/link";
import { Suspense } from "react";
import { Flash, Loading, firstParam } from "@/components/admin/Flash";
import { SubmitButton } from "@/components/admin/ui";
import { buttonClass, cardClass } from "@/components/admin/styles";
import { deleteProductAction, toggleProductAction } from "@/lib/admin/actions/catalog";
import { requireAdmin } from "@/lib/auth/guard";
import { formatBRL } from "@/lib/commerce/pricing";
import { db } from "@/lib/db";

export const metadata = { title: "Produtos" };
type SP = Promise<Record<string, string | string[] | undefined>>;

async function Products({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = firstParam(sp.q).trim();
  const products = await db.product.findMany({
    where: { deletedAt: null, ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}) },
    include: { category: { select: { name: true } }, variants: { where: { active: true }, select: { stockQuantity: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-marinho">Produtos</h1>
        <Link href="/admin/produtos/novo" className={buttonClass("primary")}>Novo produto</Link>
      </div>
      <Flash ok={firstParam(sp.ok)} erro={firstParam(sp.erro)} />
      <form method="get" className="flex gap-2">
        <label htmlFor="q" className="sr-only">Buscar produto</label>
        <input id="q" name="q" defaultValue={q} placeholder="Buscar por nome" className="w-full max-w-sm rounded-md border border-borda bg-white px-3 py-2 text-sm" />
        <button type="submit" className={buttonClass("secondary", true)}>Buscar</button>
      </form>

      {products.length === 0 ? (
        <div className="rounded-md border border-dashed border-borda bg-white p-10 text-center text-muted">Nenhum produto cadastrado.</div>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => {
            const stock = p.variants.length ? p.variants.reduce((s, v) => s + v.stockQuantity, 0) : p.stockQuantity;
            return (
              <li key={p.id} className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}>
                <div>
                  <Link href={`/admin/produtos/${p.id}`} className="font-display text-lg font-semibold text-marinho hover:underline">{p.name}</Link>
                  <p className="text-sm text-muted">
                    {p.category.name} · {formatBRL(p.promotionalPriceCents ?? p.priceCents)} · Estoque {stock}
                    {!p.active && " · Inativo"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/produtos/${p.id}`} className={buttonClass("secondary", true)}>Editar</Link>
                  <form action={toggleProductAction.bind(null, p.id)}>
                    <SubmitButton variant="secondary" small>{p.active ? "Desativar" : "Ativar"}</SubmitButton>
                  </form>
                  <form action={deleteProductAction.bind(null, p.id)}>
                    <SubmitButton variant="danger" small confirm={`Excluir "${p.name}"? Pedidos antigos continuam guardados.`}>Excluir</SubmitButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function ProdutosAdminPage({ searchParams }: { searchParams: SP }) {
  return <Suspense fallback={<Loading />}><Products searchParams={searchParams} /></Suspense>;
}
