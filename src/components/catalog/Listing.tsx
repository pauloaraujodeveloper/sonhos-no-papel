import Link from "next/link";
import { listCategories, listProducts, type SortKey } from "@/lib/catalog/queries";
import { ProductGrid } from "./ProductCard";

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Converte "12,50" ou "12.50" (reais) em centavos. Retorna undefined se vazio ou inválido. */
function parseReais(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
}

const SORTS: { value: SortKey; label: string }[] = [
  { value: "novidades", label: "Novidades" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
];

function buildHref(basePath: string, sp: SearchParams, page: number) {
  const qs = new URLSearchParams();
  for (const [key, raw] of Object.entries(sp)) {
    const v = first(raw);
    if (v && key !== "pagina") qs.set(key, v);
  }
  if (page > 1) qs.set("pagina", String(page));
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/**
 * Listagem com busca, filtro por categoria e preço, ordenação e paginação.
 * Os filtros são um formulário GET: funciona sem JavaScript e mantém o histórico do navegador.
 */
export async function Listing({
  searchParams,
  basePath,
  fixedCategorySlug,
}: {
  searchParams: Promise<SearchParams>;
  basePath: string;
  fixedCategorySlug?: string;
}) {
  const sp = await searchParams;
  const q = first(sp.q) ?? "";
  const categoria = fixedCategorySlug ?? first(sp.categoria) ?? "";
  const ordem = (SORTS.find((s) => s.value === first(sp.ordem))?.value ?? "novidades") as SortKey;
  const minRaw = first(sp.min) ?? "";
  const maxRaw = first(sp.max) ?? "";
  const pagina = Math.max(1, Number.parseInt(first(sp.pagina) ?? "1", 10) || 1);

  const [categories, result] = await Promise.all([
    listCategories(),
    listProducts({
      q,
      categorySlug: categoria || undefined,
      sort: ordem,
      page: pagina,
      minCents: parseReais(minRaw),
      maxCents: parseReais(maxRaw),
    }),
  ]);

  const hasFilters = Boolean(q || (!fixedCategorySlug && categoria) || minRaw || maxRaw);
  const input =
    "w-full rounded-md border border-borda bg-white px-3 py-2 text-sm text-marinho focus:border-rosa focus:outline-none";

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <form action={basePath} method="get" className="space-y-4 rounded-md border border-borda bg-white p-4 shadow-suave lg:self-start">
        <div>
          <label htmlFor="f-q" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            Buscar
          </label>
          <input id="f-q" name="q" defaultValue={q} placeholder="Nome ou descrição" className={input} />
        </div>
        {!fixedCategorySlug && (
          <div>
            <label htmlFor="f-cat" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
              Categoria
            </label>
            <select id="f-cat" name="categoria" defaultValue={categoria} className={input}>
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="f-min" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
              Preço mín.
            </label>
            <input id="f-min" name="min" inputMode="decimal" defaultValue={minRaw} placeholder="0" className={input} />
          </div>
          <div>
            <label htmlFor="f-max" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
              Preço máx.
            </label>
            <input id="f-max" name="max" inputMode="decimal" defaultValue={maxRaw} placeholder="100" className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="f-ordem" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            Ordenar por
          </label>
          <select id="f-ordem" name="ordem" defaultValue={ordem} className={input}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-full bg-marinho px-4 py-2 text-sm font-semibold text-papel transition-colors hover:bg-marinho-texto">
            Aplicar
          </button>
          {hasFilters && (
            <Link href={basePath} className="rounded-full border border-borda px-4 py-2 text-sm font-semibold text-marinho-texto hover:bg-bebe-soft">
              Limpar
            </Link>
          )}
        </div>
      </form>

      <div>
        <p className="mb-3 text-sm text-muted" aria-live="polite">
          {result.total === 0 ? "Nenhum produto encontrado" : `${result.total} ${result.total === 1 ? "produto" : "produtos"}`}
        </p>

        {result.items.length === 0 ? (
          <div className="rounded-md border border-dashed border-borda bg-white p-10 text-center">
            <p className="font-display text-lg font-semibold text-marinho">Nada por aqui ainda</p>
            <p className="mt-1 text-sm text-muted">
              {hasFilters ? "Tente outros termos ou limpe os filtros." : "Os produtos serão cadastrados em breve."}
            </p>
          </div>
        ) : (
          <ProductGrid products={result.items} />
        )}

        {result.pageCount > 1 && (
          <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-2">
            {result.page > 1 && (
              <Link href={buildHref(basePath, sp, result.page - 1)} className="rounded-full border border-borda px-4 py-2 text-sm font-semibold text-marinho-texto hover:bg-bebe-soft">
                Anterior
              </Link>
            )}
            <span className="px-2 text-sm text-muted">
              Página {result.page} de {result.pageCount}
            </span>
            {result.page < result.pageCount && (
              <Link href={buildHref(basePath, sp, result.page + 1)} className="rounded-full border border-borda px-4 py-2 text-sm font-semibold text-marinho-texto hover:bg-bebe-soft">
                Próxima
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
