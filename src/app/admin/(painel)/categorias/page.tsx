import { Suspense } from "react";
import { Flash, Loading, firstParam } from "@/components/admin/Flash";
import { SubmitButton } from "@/components/admin/ui";
import { cardClass, inputClass, labelClass } from "@/components/admin/styles";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/admin/actions/catalog";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";

export const metadata = { title: "Categorias" };
type SP = Promise<Record<string, string | string[] | undefined>>;

async function Categories({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { deletedAt: null } } } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-marinho">Categorias</h1>
      <Flash ok={firstParam(sp.ok)} erro={firstParam(sp.erro)} />

      <section className={cardClass} aria-labelledby="nova">
        <h2 id="nova" className="mb-3 font-display text-lg font-semibold text-marinho">Nova categoria</h2>
        <form action={saveCategoryAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end">
          <div>
            <label htmlFor="new-name" className={labelClass}>Nome</label>
            <input id="new-name" name="name" required minLength={2} maxLength={60} className={inputClass} />
          </div>
          <div>
            <label htmlFor="new-desc" className={labelClass}>Descrição</label>
            <input id="new-desc" name="description" maxLength={300} className={inputClass} />
          </div>
          <div>
            <label htmlFor="new-order" className={labelClass}>Ordem</label>
            <input id="new-order" name="sortOrder" type="number" defaultValue={categories.length + 1} className={inputClass} />
          </div>
          <SubmitButton>Criar</SubmitButton>
        </form>
      </section>

      <ul className="space-y-3">
        {categories.map((c) => (
          <li key={c.id} className={cardClass}>
            <form action={saveCategoryAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_6rem_auto_auto] sm:items-end">
              <input type="hidden" name="id" value={c.id} />
              <div>
                <label htmlFor={`n-${c.id}`} className={labelClass}>Nome</label>
                <input id={`n-${c.id}`} name="name" required defaultValue={c.name} maxLength={60} className={inputClass} />
              </div>
              <div>
                <label htmlFor={`d-${c.id}`} className={labelClass}>Descrição</label>
                <input id={`d-${c.id}`} name="description" defaultValue={c.description ?? ""} maxLength={300} className={inputClass} />
              </div>
              <div>
                <label htmlFor={`o-${c.id}`} className={labelClass}>Ordem</label>
                <input id={`o-${c.id}`} name="sortOrder" type="number" defaultValue={c.sortOrder} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-marinho">
                <input type="checkbox" name="active" defaultChecked={c.active} className="h-4 w-4 accent-marinho" /> Ativa
              </label>
              <SubmitButton variant="secondary" small>Salvar</SubmitButton>
            </form>
            <div className="mt-3 flex items-center justify-between text-sm text-muted">
              <span>{c._count.products} produto(s) · /{c.slug}</span>
              <form action={deleteCategoryAction.bind(null, c.id)}>
                <SubmitButton variant="danger" small confirm={`Excluir a categoria "${c.name}"?`}>Excluir</SubmitButton>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Page({ searchParams }: { searchParams: SP }) {
  return <Suspense fallback={<Loading />}><Categories searchParams={searchParams} /></Suspense>;
}
