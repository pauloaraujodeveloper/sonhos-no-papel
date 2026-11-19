import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/catalog/AddToCart";
import { ProductGrid, ProductImage, StockBadge } from "@/components/catalog/ProductCard";
import { getProductBySlug } from "@/lib/catalog/queries";
import { formatBRL } from "@/lib/commerce/pricing";

const STOCK_TEXT = {
  AVAILABLE: "Disponível",
  LOW_STOCK: "Últimas unidades",
  OUT_OF_STOCK: "Esgotado",
} as const;

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [mainImage, ...otherImages] = product.images;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.effectivePriceCents / 100).toFixed(2),
      availability:
        product.stockStatus === "OUT_OF_STOCK" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Você está em" className="mb-4 text-sm text-muted">
        <Link href="/produtos" className="hover:underline">
          Produtos
        </Link>{" "}
        /{" "}
        <Link href={`/categoria/${product.categorySlug}`} className="hover:underline">
          {product.categoryName}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-md border border-borda bg-white">
            <ProductImage url={mainImage?.url ?? null} alt={mainImage?.alt ?? product.name} className="aspect-square h-full w-full" />
          </div>
          {otherImages.length > 0 && (
            <ul className="grid grid-cols-4 gap-2">
              {otherImages.map((img) => (
                <li key={img.url} className="overflow-hidden rounded-sm border border-borda">
                  <ProductImage url={img.url} alt={img.alt ?? product.name} className="aspect-square h-full w-full" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-5">
          <StockBadge status={product.stockStatus} promo={product.promotionalPriceCents !== null} isNew={product.isNew} />
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-marinho">{product.name}</h1>
          <p className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-marinho">{formatBRL(product.effectivePriceCents)}</span>
            {product.promotionalPriceCents !== null && (
              <span className="text-lg text-muted line-through">{formatBRL(product.priceCents)}</span>
            )}
          </p>
          <p className="text-sm font-semibold text-marinho-texto">{STOCK_TEXT[product.stockStatus]}</p>

          {product.description && <p className="leading-relaxed text-muted">{product.description}</p>}

          <AddToCart productId={product.id} variants={product.variants} availableQuantity={product.availableQuantity} />
        </div>
      </div>

      {product.related.length > 0 && (
        <section aria-labelledby="relacionados" className="mt-14">
          <h2 id="relacionados" className="mb-4 font-display text-2xl font-semibold text-marinho">
            Produtos relacionados
          </h2>
          <ProductGrid products={product.related} />
        </section>
      )}
    </>
  );
}

export default function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-lilas-soft" aria-hidden="true" />}>
        <ProductContent params={params} />
      </Suspense>
    </main>
  );
}
