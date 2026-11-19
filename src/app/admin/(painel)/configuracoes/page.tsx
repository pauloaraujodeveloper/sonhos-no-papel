import { Suspense } from "react";
import { Flash, Loading, firstParam } from "@/components/admin/Flash";
import { SubmitButton } from "@/components/admin/ui";
import { cardClass, inputClass, labelClass } from "@/components/admin/styles";
import { deleteZoneAction, saveSettingsAction, saveZoneAction } from "@/lib/admin/actions/settings";
import { SETTINGS_ROLES, requireAdmin } from "@/lib/auth/guard";
import { centsToInput } from "@/lib/commerce/money";
import { formatBRL } from "@/lib/commerce/pricing";
import { db } from "@/lib/db";

export const metadata = { title: "Configurações" };
type SP = Promise<Record<string, string | string[] | undefined>>;

async function Settings({ searchParams }: { searchParams: SP }) {
  await requireAdmin({ roles: SETTINGS_ROLES });
  const sp = await searchParams;
  const [s, zones] = await Promise.all([
    db.storeSettings.findUnique({ where: { id: "default" } }),
    db.deliveryZone.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  const social = (s?.socialLinks ?? {}) as { instagram?: string };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-marinho">Configurações</h1>
      <Flash ok={firstParam(sp.ok)} erro={firstParam(sp.erro)} />

      <form action={saveSettingsAction} className="space-y-6">
        <section className={`${cardClass} grid gap-4 sm:grid-cols-2`} aria-labelledby="loja">
          <h2 id="loja" className="font-display text-lg font-semibold text-marinho sm:col-span-2">Loja e WhatsApp</h2>
          <div>
            <label htmlFor="storeName" className={labelClass}>Nome da loja</label>
            <input id="storeName" name="storeName" required defaultValue={s?.storeName ?? "Sonhos no Papel"} className={inputClass} />
          </div>
          <div>
            <label htmlFor="whatsappNumber" className={labelClass}>WhatsApp dos pedidos</label>
            <input id="whatsappNumber" name="whatsappNumber" inputMode="tel" placeholder="(11) 91234-5678" defaultValue={s?.whatsappNumber ?? ""} className={inputClass} />
            <p className="mt-1 text-xs text-muted">Sem esse número a loja não consegue finalizar pedidos.</p>
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>E-mail</label>
            <input id="email" name="email" type="email" defaultValue={s?.email ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Telefone</label>
            <input id="phone" name="phone" defaultValue={s?.phone ?? ""} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className={labelClass}>Endereço da loja</label>
            <input id="address" name="address" defaultValue={s?.address ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="openingHours" className={labelClass}>Horário de atendimento</label>
            <input id="openingHours" name="openingHours" defaultValue={s?.openingHours ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="instagram" className={labelClass}>Instagram (@usuário ou link)</label>
            <input id="instagram" name="instagram" defaultValue={social.instagram ?? ""} placeholder="@sonhosnopapel" className={inputClass} />
            <p className="mt-1 text-xs text-muted">Aparece como ícone no rodapé e na página inicial.</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pickupInstructions" className={labelClass}>Orientações de retirada</label>
            <textarea id="pickupInstructions" name="pickupInstructions" rows={2} defaultValue={s?.pickupInstructions ?? ""} className={inputClass} />
          </div>
        </section>

        <section className={`${cardClass} grid gap-4 sm:grid-cols-2`} aria-labelledby="pix">
          <h2 id="pix" className="font-display text-lg font-semibold text-marinho sm:col-span-2">Pix (enviado pelo WhatsApp)</h2>
          <p className="text-sm text-muted sm:col-span-2">
            O site não cobra Pix. Estes dados aparecem na mensagem que você envia ao cliente pelo painel de pedidos.
          </p>
          <div>
            <label htmlFor="pixKey" className={labelClass}>Chave Pix</label>
            <input id="pixKey" name="pixKey" maxLength={77} defaultValue={s?.pixKey ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="pixKeyType" className={labelClass}>Tipo da chave</label>
            <select id="pixKeyType" name="pixKeyType" defaultValue={s?.pixKeyType ?? ""} className={inputClass}>
              <option value="">—</option>
              <option value="CPF_CNPJ">CPF/CNPJ</option>
              <option value="EMAIL">E-mail</option>
              <option value="PHONE">Telefone</option>
              <option value="RANDOM">Chave aleatória</option>
            </select>
          </div>
          <div>
            <label htmlFor="pixReceiverName" className={labelClass}>Nome do titular (até 25)</label>
            <input id="pixReceiverName" name="pixReceiverName" maxLength={25} defaultValue={s?.pixReceiverName ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="pixBankName" className={labelClass}>Banco</label>
            <input id="pixBankName" name="pixBankName" maxLength={60} defaultValue={s?.pixBankName ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="pixCity" className={labelClass}>Cidade (até 15)</label>
            <input id="pixCity" name="pixCity" maxLength={15} defaultValue={s?.pixCity ?? ""} className={inputClass} />
          </div>
        </section>

        <section className={`${cardClass} grid gap-4 sm:grid-cols-2`} aria-labelledby="entrega">
          <h2 id="entrega" className="font-display text-lg font-semibold text-marinho sm:col-span-2">Entrega (regra geral)</h2>
          <div>
            <label htmlFor="deliveryFlatFee" className={labelClass}>Taxa fixa de entrega (R$)</label>
            <input id="deliveryFlatFee" name="deliveryFlatFee" inputMode="decimal" defaultValue={centsToInput(s?.deliveryFlatFeeCents ?? 0)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="deliveryFreeAbove" className={labelClass}>Entrega grátis a partir de (R$)</label>
            <input id="deliveryFreeAbove" name="deliveryFreeAbove" inputMode="decimal" placeholder="opcional" defaultValue={centsToInput(s?.deliveryFreeAboveCents)} className={inputClass} />
          </div>
        </section>

        <SubmitButton>Salvar configurações</SubmitButton>
      </form>

      <section className={cardClass} aria-labelledby="zonas">
        <h2 id="zonas" className="mb-1 font-display text-lg font-semibold text-marinho">Regiões e bairros com taxa própria</h2>
        <p className="mb-3 text-sm text-muted">Quando o bairro informado no checkout coincide com uma região, vale a taxa dela. Caso contrário, vale a regra geral.</p>
        <form action={saveZoneAction} className="mb-4 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="zn" className={labelClass}>Bairro ou região</label>
            <input id="zn" name="name" required minLength={2} maxLength={80} className={inputClass} />
          </div>
          <div>
            <label htmlFor="zf" className={labelClass}>Taxa (R$)</label>
            <input id="zf" name="fee" inputMode="decimal" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="zfa" className={labelClass}>Grátis a partir de</label>
            <input id="zfa" name="freeAbove" inputMode="decimal" placeholder="opcional" className={inputClass} />
          </div>
          <SubmitButton variant="secondary" small>Adicionar</SubmitButton>
        </form>
        {zones.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma região cadastrada.</p>
        ) : (
          <ul className="divide-y divide-borda">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-marinho">
                  <strong>{z.name}</strong> · {formatBRL(z.feeCents)}
                  {z.freeAboveCents !== null && ` · grátis a partir de ${formatBRL(z.freeAboveCents)}`}
                </span>
                <form action={deleteZoneAction.bind(null, z.id)}>
                  <SubmitButton variant="danger" small confirm={`Remover "${z.name}"?`}>Remover</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function Page({ searchParams }: { searchParams: SP }) {
  return <Suspense fallback={<Loading />}><Settings searchParams={searchParams} /></Suspense>;
}
