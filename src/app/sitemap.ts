import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { connection } from "next/server";
import { db } from "@/lib/db";

const base = SITE_URL;

/** Sitemap gerado do banco: home, listagem, categorias ativas e produtos ativos. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [categories, products] = await Promise.all([
    db.category.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    db.product.findMany({ where: { active: true, deletedAt: null }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/produtos`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${base}/categoria/${c.slug}`, lastModified: c.updatedAt, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/produto/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 })),
  ];
}
