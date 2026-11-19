import { Suspense } from "react";
import { Flash, Loading, firstParam } from "@/components/admin/Flash";
import { cardClass, inputClass, labelClass } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { saveThemeAction } from "@/lib/admin/actions/theme";
import { SETTINGS_ROLES, requireAdmin } from "@/lib/auth/guard";
import { BRAND } from "@/lib/brand";
import { getTheme } from "@/lib/theme-server";

export const metadata = { title: "Aparência" };
type SP = Promise<Record<string, string | string[] | undefined>>;

const FIELDS = [
  { name: "bebe", label: "Azul-bebê", hint: "Fundos suaves e destaques" },
  { name: "lilas", label: "Lilás", hint: "Cartões e detalhes" },
  { name: "rosa", label: "Rosa", hint: "Selos e detalhes" },
  { name: "marinho", label: "Azul-marinho", hint: "Títulos e botões principais" },
  { name: "destaque", label: "Cor de destaque", hint: "Links e botões secundários" },
] as const;

async function Appearance({ searchParams }: { searchParams: SP }) {
  await requireAdmin({ roles: SETTINGS_ROLES });
  const sp = await searchParams;
  const theme = await getTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-marinho">Aparência</h1>
        <p className="text-sm text-muted">As mudanças valem na hora para toda a loja, sem novo deploy.</p>
      </div>
      <Flash ok={firstParam(sp.ok)} erro={firstParam(sp.erro)} />

      <form action={saveThemeAction} className="space-y-6">
        <section className={`${cardClass} grid gap-4 sm:grid-cols-2 lg:grid-cols-5`} aria-labelledby="cores">
          <h2 id="cores" className="font-display text-lg font-semibold text-marinho sm:col-span-2 lg:col-span-5">Cores da marca</h2>
          {FIELDS.map((f) => (
            <div key={f.name}>
              <label htmlFor={f.name} className={labelClass}>{f.label}</label>
              <input id={f.name} name={f.name} type="color" defaultValue={theme[f.name]} className="h-11 w-full cursor-pointer rounded-md border border-borda bg-white p-1" />
              <p className="mt-1 text-xs text-muted">{f.hint}</p>
            </div>
          ))}
        </section>

        <section className={cardClass} aria-labelledby="slogan">
          <h2 id="slogan" className="mb-3 font-display text-lg font-semibold text-marinho">Assinatura da marca</h2>
          <label htmlFor="sloganInput" className={labelClass}>Frase principal da página inicial</label>
          <input id="sloganInput" name="slogan" maxLength={90} defaultValue={theme.slogan} placeholder={BRAND.slogan} className={inputClass} />
          <p className="mt-1 text-xs text-muted">Deixe em branco para usar “{BRAND.slogan}”.</p>
        </section>

        <div className="flex flex-wrap gap-3">
          <SubmitButton>Salvar aparência</SubmitButton>
        </div>
      </form>

      <form action={saveThemeAction}>
        <input type="hidden" name="restore" value="1" />
        {FIELDS.map((f) => <input key={f.name} type="hidden" name={f.name} value={theme[f.name]} />)}
        <SubmitButton variant="secondary" small confirm="Voltar às cores e à frase padrão da marca?">Restaurar padrão</SubmitButton>
      </form>

      <p className="text-xs text-muted">Fotos de produtos e banners já podem ser enviadas nas respectivas telas. A troca da logo ainda não está disponível.</p>
    </div>
  );
}

export default function Page({ searchParams }: { searchParams: SP }) {
  return <Suspense fallback={<Loading />}><Appearance searchParams={searchParams} /></Suspense>;
}
