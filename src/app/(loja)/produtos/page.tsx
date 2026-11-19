import type { Metadata } from "next";
import { Suspense } from "react";
import { Listing } from "@/components/catalog/Listing";
import { ProductGridSkeleton } from "@/components/catalog/ProductCard";

export const metadata: Metadata = {
  title: "Produtos",
  description: "Canetas, lápis, agendas, cadernos e pincéis da Sonhos no Papel.",
};

export default function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-marinho">Produtos</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <Listing searchParams={searchParams} basePath="/produtos" />
      </Suspense>
    </main>
  );
}
