import { Suspense } from "react";
import { Flash, Loading, firstParam } from "@/components/admin/Flash";
import { cardClass, inputClass, labelClass } from "@/components/admin/styles";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { SubmitButton } from "@/components/admin/ui";
import { deleteBannerAction, saveBannerAction } from "@/lib/admin/actions/banners";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";

export const metadata = { title: "Banners" };
type SP = Promise<Record<string, string | string[] | undefined>>;

function BannerFields({ b }: { b?: { id: string; title: string; subtitle: string | null; imageUrl: string | null; linkUrl: string | null; sortOrder: number; active: boolean } }) {
  const p = b?.id ?? "new";
  return (
    <>
      {b && <input type="hidden" name="id" value={b.id} />}
      <div className="sm:col-span-2">
        <label htmlFor={`t-${p}`} className={labelClass}>Título</label>
        <input id={`t-${p}`} name="title" required minLength={2} maxLength={90} defaultValue={b?.title} className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`s-${p}`} className={labelClass}>Texto de apoio</label>
        <input id={`s-${p}`} name="subtitle" maxLength={220} defaultValue={b?.subtitle ?? ""} className={inputClass} />
      </div>
      <div>
        <label htmlFor={`i-${p}`} className={labelClass}>Imagem (link https)</label>
        <input id={`i-${p}`} name="imageUrl" defaultValue={b?.imageUrl ?? ""} placeholder="opcional" className={inputClass} />
        <ImageUploader targetId={`i-${p}`} />
      </div>
      <div>
        <label htmlFor={`l-${p}`} className={labelClass}>Link do botão</label>
        <input id={`l-${p}`} name="linkUrl" defaultValue={b?.linkUrl ?? ""} placeholder="/produtos" className={inputClass} />
      </div>
      <div>
        <label htmlFor={`o-${p}`} className={labelClass}>Ordem</label>
        <input id={`o-${p}`} name="sortOrder" type="number" defaultValue={b?.sortOrder ?? 0} className={inputClass} />
      </div>
      {b && (
        <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-marinho sm:self-end">
          <input type="checkbox" name="active" defaultChecked={b.active} className="h-4 w-4 accent-marinho" /> Ativo
        </label>
      )}
    </>
  );
}

async function Banners({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const banners = await db.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-marinho">Banners</h1>
        <p className="text-sm text-muted">O primeiro banner ativo (menor ordem) aparece no topo da página inicial. Sem banner, a loja mostra o texto padrão.</p>
      </div>
      <Flash ok={firstParam(sp.ok)} erro={firstParam(sp.erro)} />

      <section className={cardClass} aria-labelledby="novo">
        <h2 id="novo" className="mb-3 font-display text-lg font-semibold text-marinho">Novo banner</h2>
        <form action={saveBannerAction} className="grid gap-3 sm:grid-cols-2">
          <BannerFields />
          <div className="sm:col-span-2"><SubmitButton>Criar banner</SubmitButton></div>
        </form>
      </section>

      {banners.map((b) => (
        <section key={b.id} className={cardClass}>
          <form action={saveBannerAction} className="grid gap-3 sm:grid-cols-2">
            <BannerFields b={b} />
            <div className="flex gap-2 sm:col-span-2">
              <SubmitButton variant="secondary" small>Salvar</SubmitButton>
            </div>
          </form>
          <form action={deleteBannerAction.bind(null, b.id)} className="mt-2">
            <SubmitButton variant="danger" small confirm={`Remover o banner "${b.title}"?`}>Remover</SubmitButton>
          </form>
        </section>
      ))}
    </div>
  );
}

export default function Page({ searchParams }: { searchParams: SP }) {
  return <Suspense fallback={<Loading />}><Banners searchParams={searchParams} /></Suspense>;
}
