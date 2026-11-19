import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Listing } from "@/components/catalog/Listing";
import { ProductGridSkeleton } from "@/components/catalog/ProductCard";
import { getCategoryBySlug } from "@/lib/catalog/queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function CategoryContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-marinho">{category.name}</h1>
      {category.description && <p className="mb-6 mt-1 text-muted">{category.description}</p>}
      <Listing searchParams={searchParams} basePath={`/categoria/${category.slug}`} fixedCategorySlug={category.slug} />
    </>
  );
}

export default function CategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Suspense fallback={<ProductGridSkeleton />}>
        <CategoryContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
