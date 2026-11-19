import { RiArrowRightLine } from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { formatBRL } from "@/lib/commerce/pricing";
import type { ProductSummary } from "@/lib/catalog/queries";

export function ProductImage({ url, alt, className = "" }: { url: string | null; alt: string; className?: string }) {
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-bebe-soft ${className}`} role="img" aria-label={`${alt} (sem foto)`}>
        <Image src="/brand/simbolo.png" alt="" width={96} height={96} className="h-1/2 w-1/2 object-contain opacity-70" />
      </div>
    );
  }
  // Imagens vêm de armazenamento externo (Cloudinary/Blob), cujo domínio é configurado depois.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" decoding="async" className={`object-cover ${className}`} />;
}

export function StockBadge({ status, promo, isNew }: { status: ProductSummary["stockStatus"]; promo?: boolean; isNew?: boolean }) {
  const base = "rounded-full px-2.5 py-0.5 text-xs font-bold";
  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "OUT_OF_STOCK" && <span className={`${base} bg-marinho text-papel`}>Esgotado</span>}
      {status === "LOW_STOCK" && <span className={`${base} bg-sol text-marinho`}>Últimas unidades</span>}
      {promo && status !== "OUT_OF_STOCK" && <span className={`${base} bg-rosa-soft text-marinho`}>Promoção</span>}
      {isNew && status !== "OUT_OF_STOCK" && <span className={`${base} bg-lilas-soft text-marinho`}>Novo</span>}
    </div>
  );
}

export function ProductCard({ product, featured = false }: { product: ProductSummary; featured?: boolean }) {
  const out = product.stockStatus === "OUT_OF_STOCK";
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-borda bg-white shadow-suave transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/produto/${product.slug}`} className="flex flex-1 flex-col">
        <div className={`relative overflow-hidden ${featured ? "min-h-64 flex-1" : "aspect-square"}`}>
          <ProductImage
            url={product.imageUrl}
            alt={product.name}
            className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${featured ? "absolute inset-0" : ""} ${out ? "opacity-60" : ""}`}
          />
          <div className="absolute left-2 top-2">
            <StockBadge status={product.stockStatus} promo={product.promotionalPriceCents !== null} isNew={product.isNew} />
          </div>
        </div>
        <div className={`flex flex-col gap-1 ${featured ? "p-5" : "flex-1 p-3"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{product.categoryName}</p>
          <h3 className={`font-display font-semibold leading-snug text-marinho ${featured ? "text-2xl" : "text-base"}`}>{product.name}</h3>
          <p className="mt-auto flex items-baseline gap-2 pt-2">
            <span className={`font-bold text-marinho ${featured ? "text-2xl" : "text-lg"}`}>{formatBRL(product.effectivePriceCents)}</span>
            {product.promotionalPriceCents !== null && (
              <span className="text-sm text-muted line-through">{formatBRL(product.priceCents)}</span>
            )}
          </p>
          {/* No computador, aparece ao passar o mouse ou focar; no celular fica sempre visível. */}
          <span className="inline-flex items-center gap-1 pt-1 text-sm font-bold text-accent-600 transition-opacity duration-300 ease-out sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            Ver produto
            <RiArrowRightLine aria-hidden="true" className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.id} className="flex">
          <div className="flex w-full flex-col">
            <ProductCard product={p} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="overflow-hidden rounded-md border border-borda bg-white">
          <div className="aspect-square animate-pulse bg-lilas-soft" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-1/3 animate-pulse rounded bg-bebe-soft" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-bebe-soft" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-lilas-soft" />
          </div>
        </li>
      ))}
    </ul>
  );
}
