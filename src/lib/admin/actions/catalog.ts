"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { parseReaisToCents, slugify } from "@/lib/commerce/money";
import { db } from "@/lib/db";

function go(path: string, kind: "ok" | "erro", message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(message)}`);
}

const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const checked = (v: FormDataEntryValue | null) => v === "on" || v === "true";

async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const root = slugify(base) || "produto";
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const found = await db.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!found || found.id === exceptId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

/** Imagens por URL https, uma por linha. Upload para armazenamento externo ainda não está configurado. */
function parseImageUrls(raw: string): string[] | null {
  const urls = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const u of urls) {
    try {
      if (new URL(u).protocol !== "https:") return null;
    } catch {
      return null;
    }
  }
  return urls.slice(0, 10);
}

/** Variações, uma por linha: "Nome; acréscimo em R$; estoque". */
function parseVariants(raw: string): { name: string; deltaCents: number; stock: number }[] | null {
  const out: { name: string; deltaCents: number; stock: number }[] = [];
  for (const line of raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const [name, delta = "0", stock = "0"] = line.split(";").map((p) => p.trim());
    const deltaCents = parseReaisToCents(delta || "0");
    const stockNumber = Number(stock || "0");
    if (!name || name.length > 60 || deltaCents === null || !Number.isInteger(stockNumber) || stockNumber < 0) return null;
    out.push({ name, deltaCents, stock: stockNumber });
  }
  return out;
}

const productSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000),
  categoryId: z.string().min(1),
  threshold: z.number().int().min(0).max(1000),
});

export async function saveProductAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  const back = id ? `/admin/produtos/${id}` : "/admin/produtos/novo";

  const parsed = productSchema.safeParse({
    name: text(formData.get("name")),
    description: text(formData.get("description")),
    categoryId: text(formData.get("categoryId")),
    threshold: Number(text(formData.get("lowStockThreshold")) || "3"),
  });
  if (!parsed.success) go(back, "erro", "Confira o nome, a categoria e o estoque mínimo.");

  const priceCents = parseReaisToCents(text(formData.get("price")));
  if (priceCents === null || priceCents <= 0) go(back, "erro", "Informe um preço válido.");
  const promoRaw = text(formData.get("promoPrice"));
  const promoCents = promoRaw ? parseReaisToCents(promoRaw) : null;
  if (promoRaw && (promoCents === null || promoCents <= 0 || promoCents >= priceCents)) {
    go(back, "erro", "O preço promocional deve ser menor que o preço.");
  }

  const images = parseImageUrls(text(formData.get("images")));
  if (!images) go(back, "erro", "As imagens devem ser links https válidos, um por linha.");
  const variants = parseVariants(text(formData.get("variants")));
  if (!variants) go(back, "erro", "Variações inválidas. Use: Nome; acréscimo; estoque (uma por linha).");

  const category = await db.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } });
  if (!category) go(back, "erro", "Categoria não encontrada.");

  const common = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    categoryId: category.id,
    priceCents,
    promotionalPriceCents: promoCents,
    lowStockThreshold: parsed.data.threshold,
    active: checked(formData.get("active")),
    featured: checked(formData.get("featured")),
    isNew: checked(formData.get("isNew")),
    sku: text(formData.get("sku")) || null,
  };

  let productId = id;
  try {
    if (id) {
      const existing = await db.product.findUnique({ where: { id }, select: { id: true, slug: true, name: true } });
      if (!existing) go("/admin/produtos", "erro", "Produto não encontrado.");
      await db.$transaction(async (tx) => {
        await tx.product.update({ where: { id }, data: common });
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({ data: images.map((url, i) => ({ productId: id, url, alt: parsed.data.name, sortOrder: i })) });

        const current = await tx.productVariant.findMany({ where: { productId: id } });
        const wanted = new Map(variants.map((v) => [v.name.toLowerCase(), v]));
        for (const c of current) {
          const w = wanted.get(c.name.toLowerCase());
          if (w) await tx.productVariant.update({ where: { id: c.id }, data: { priceDeltaCents: w.deltaCents, active: true } });
          else await tx.productVariant.update({ where: { id: c.id }, data: { active: false } });
        }
        const names = new Set(current.map((c) => c.name.toLowerCase()));
        for (const v of variants) {
          if (!names.has(v.name.toLowerCase())) {
            await tx.productVariant.create({ data: { productId: id, name: v.name, priceDeltaCents: v.deltaCents, stockQuantity: v.stock } });
          }
        }
      });
    } else {
      const initialStock = Number(text(formData.get("stock")) || "0");
      if (!Number.isInteger(initialStock) || initialStock < 0) go(back, "erro", "Estoque inicial inválido.");
      const slug = await uniqueSlug(parsed.data.name);
      const created = await db.$transaction(async (tx) => {
        const p = await tx.product.create({
          data: {
            ...common,
            slug,
            stockQuantity: variants.length ? 0 : initialStock,
            images: { create: images.map((url, i) => ({ url, alt: parsed.data.name, sortOrder: i })) },
            variants: { create: variants.map((v) => ({ name: v.name, priceDeltaCents: v.deltaCents, stockQuantity: v.stock })) },
          },
        });
        if (!variants.length && initialStock > 0) {
          await tx.inventoryMovement.create({ data: { productId: p.id, type: "ENTRY", quantity: initialStock, balanceAfter: initialStock, reason: "Estoque inicial" } });
        }
        return p;
      });
      productId = created.id;
    }
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error; // redirect interno do Next
    console.error("[admin/products] falha ao salvar", error instanceof Error ? error.name : "erro");
    go(back, "erro", "Não foi possível salvar o produto. O SKU pode já estar em uso.");
  }
  go(`/admin/produtos/${productId}`, "ok", "Produto salvo.");
}

export async function toggleProductAction(productId: string) {
  await requireAdmin();
  const p = await db.product.findUnique({ where: { id: productId }, select: { active: true } });
  if (!p) go("/admin/produtos", "erro", "Produto não encontrado.");
  await db.product.update({ where: { id: productId }, data: { active: !p.active } });
  go("/admin/produtos", "ok", p.active ? "Produto desativado." : "Produto ativado.");
}

/** Exclusão lógica: pedidos antigos continuam referenciando o produto. */
export async function deleteProductAction(productId: string) {
  await requireAdmin();
  await db.product.update({ where: { id: productId }, data: { deletedAt: new Date(), active: false } }).catch(() => null);
  go("/admin/produtos", "ok", "Produto excluído.");
}

const categorySchema = z.object({ name: z.string().min(2).max(60), description: z.string().max(300) });

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  const parsed = categorySchema.safeParse({ name: text(formData.get("name")), description: text(formData.get("description")) });
  if (!parsed.success) go("/admin/categorias", "erro", "Informe um nome válido para a categoria.");
  const sortOrder = Number.parseInt(text(formData.get("sortOrder")) || "0", 10) || 0;
  const slug = slugify(parsed.data.name);
  if (!slug) go("/admin/categorias", "erro", "Nome inválido.");
  const data = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    sortOrder,
    active: id ? checked(formData.get("active")) : true,
  };
  try {
    if (id) await db.category.update({ where: { id }, data: { ...data, slug } });
    else await db.category.create({ data: { ...data, slug } });
  } catch {
    go("/admin/categorias", "erro", "Já existe uma categoria com esse nome.");
  }
  go("/admin/categorias", "ok", "Categoria salva.");
}

export async function deleteCategoryAction(categoryId: string) {
  await requireAdmin();
  const count = await db.product.count({ where: { categoryId, deletedAt: null } });
  if (count > 0) go("/admin/categorias", "erro", `Há ${count} produto(s) nessa categoria. Mova-os antes de excluir.`);
  try {
    await db.category.delete({ where: { id: categoryId } });
  } catch {
    go("/admin/categorias", "erro", "Não foi possível excluir: há produtos já removidos ligados a ela. Desative a categoria.");
  }
  go("/admin/categorias", "ok", "Categoria excluída.");
}
