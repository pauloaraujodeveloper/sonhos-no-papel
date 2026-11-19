import { Suspense } from "react";
import { Flash, Loading, firstParam } from "@/components/admin/Flash";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";

export const metadata = { title: "Novo produto" };

async function NewProduct({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const categories = await db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-marinho">Novo produto</h1>
      <Flash ok={firstParam(sp.ok)} erro={firstParam(sp.erro)} />
      <ProductForm categories={categories} />
    </div>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <Suspense fallback={<Loading />}><NewProduct searchParams={searchParams} /></Suspense>;
}
