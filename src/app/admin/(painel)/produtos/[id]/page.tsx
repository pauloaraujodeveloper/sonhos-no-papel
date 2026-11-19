import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Flash, Loading, firstParam } from "@/components/admin/Flash";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";

export const metadata = { title: "Editar produto" };
type SP = Promise<Record<string, string | string[] | undefined>>;

async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const [product, categories] = await Promise.all([
    db.product.findFirst({
      where: { id, deletedAt: null },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: { where: { active: true }, orderBy: { createdAt: "asc" } } },
    }),
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/produtos" className="text-sm font-semibold text-marinho-texto hover:underline">← Produtos</Link>
        <h1 className="font-display text-3xl font-semibold text-marinho">{product.name}</h1>
        <Link href={`/produto/${product.slug}`} target="_blank" className="text-sm text-muted hover:underline">Ver na loja</Link>
      </div>
      <Flash ok={firstParam(sp.ok)} erro={firstParam(sp.erro)} />
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          description: product.description ?? "",
          sku: product.sku ?? "",
          categoryId: product.categoryId,
          priceCents: product.priceCents,
          promotionalPriceCents: product.promotionalPriceCents,
          lowStockThreshold: product.lowStockThreshold,
          active: product.active,
          featured: product.featured,
          isNew: product.isNew,
          images: product.images.map((i) => i.url),
          variants: product.variants.map((v) => ({ name: v.name, priceDeltaCents: v.priceDeltaCents, stockQuantity: v.stockQuantity })),
        }}
      />
    </div>
  );
}

export default function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  return <Suspense fallback={<Loading />}><EditProduct params={params} searchParams={searchParams} /></Suspense>;
}
