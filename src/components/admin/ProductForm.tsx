import { SubmitButton } from "@/components/admin/ui";
import { cardClass, inputClass, labelClass } from "@/components/admin/styles";
import { saveProductAction } from "@/lib/admin/actions/catalog";
import { centsToInput } from "@/lib/commerce/money";

export interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  sku: string;
  categoryId: string;
  priceCents: number | null;
  promotionalPriceCents: number | null;
  lowStockThreshold: number;
  active: boolean;
  featured: boolean;
  isNew: boolean;
  images: string[];
  variants: { name: string; priceDeltaCents: number; stockQuantity: number }[];
}

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductFormData;
  categories: { id: string; name: string }[];
}) {
  const editing = Boolean(product?.id);
  const check = "h-4 w-4 rounded border-borda accent-marinho";
  return (
    <form action={saveProductAction} className="space-y-6">
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      <section className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
        <div className="sm:col-span-2">
          <label htmlFor="name" className={labelClass}>Nome</label>
          <input id="name" name="name" required minLength={2} maxLength={120} defaultValue={product?.name} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className={labelClass}>Descrição</label>
          <textarea id="description" name="description" rows={4} maxLength={2000} defaultValue={product?.description} className={inputClass} />
        </div>
        <div>
          <label htmlFor="categoryId" className={labelClass}>Categoria</label>
          <select id="categoryId" name="categoryId" required defaultValue={product?.categoryId ?? ""} className={inputClass}>
            <option value="" disabled>Escolha…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sku" className={labelClass}>SKU (opcional)</label>
          <input id="sku" name="sku" maxLength={40} defaultValue={product?.sku} className={inputClass} />
        </div>
      </section>

      <section className={`${cardClass} grid gap-4 sm:grid-cols-3`}>
        <div>
          <label htmlFor="price" className={labelClass}>Preço (R$)</label>
          <input id="price" name="price" required inputMode="decimal" placeholder="10,00" defaultValue={centsToInput(product?.priceCents)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="promoPrice" className={labelClass}>Preço promocional (R$)</label>
          <input id="promoPrice" name="promoPrice" inputMode="decimal" placeholder="opcional" defaultValue={centsToInput(product?.promotionalPriceCents)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="lowStockThreshold" className={labelClass}>Estoque mínimo (alerta)</label>
          <input id="lowStockThreshold" name="lowStockThreshold" type="number" min={0} defaultValue={product?.lowStockThreshold ?? 3} className={inputClass} />
        </div>
        {!editing && (
          <div>
            <label htmlFor="stock" className={labelClass}>Estoque inicial</label>
            <input id="stock" name="stock" type="number" min={0} defaultValue={0} className={inputClass} />
            <p className="mt-1 text-xs text-muted">Ignorado se houver variações.</p>
          </div>
        )}
        {editing && <p className="text-xs text-muted sm:col-span-3">O estoque é ajustado na tela Estoque, com histórico.</p>}
      </section>

      <section className={`${cardClass} space-y-4`}>
        <div>
          <label htmlFor="variants" className={labelClass}>Variações (opcional)</label>
          <textarea
            id="variants"
            name="variants"
            rows={3}
            placeholder={"Azul; 0; 10\nRosa; 2,00; 5"}
            defaultValue={product?.variants.map((v) => `${v.name}; ${centsToInput(v.priceDeltaCents)}; ${v.stockQuantity}`).join("\n")}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted">Uma por linha: Nome; acréscimo de preço em R$; estoque (o estoque só vale ao criar a variação).</p>
        </div>
        <div>
          <label htmlFor="images" className={labelClass}>Imagens (links https, um por linha)</label>
          <textarea id="images" name="images" rows={3} defaultValue={product?.images.join("\n")} className={inputClass} />
          <p className="mt-1 text-xs text-muted">Envio de arquivos depende de configurar o armazenamento de imagens (Cloudinary ou Vercel Blob).</p>
        </div>
      </section>

      <section className={`${cardClass} flex flex-wrap gap-6`}>
        <label className="flex items-center gap-2 text-sm font-semibold text-marinho"><input type="checkbox" name="active" defaultChecked={product?.active ?? true} className={check} /> Ativo na loja</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-marinho"><input type="checkbox" name="featured" defaultChecked={product?.featured} className={check} /> Destaque</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-marinho"><input type="checkbox" name="isNew" defaultChecked={product?.isNew} className={check} /> Novidade</label>
      </section>

      <SubmitButton>{editing ? "Salvar alterações" : "Criar produto"}</SubmitButton>
    </form>
  );
}
