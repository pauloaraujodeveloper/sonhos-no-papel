"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";

function go(kind: "ok" | "erro", message: string): never {
  redirect(`/admin/banners?${kind}=${encodeURIComponent(message)}`);
}
const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();

const schema = z.object({
  title: z.string().min(2).max(90),
  subtitle: z.string().max(220),
  imageUrl: z.string().max(500),
  linkUrl: z.string().max(300),
});

/** Link interno (/produtos...) ou https externo. Bloqueia javascript: e similares. */
function safeLink(value: string): boolean {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function saveBannerAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  const parsed = schema.safeParse({
    title: text(formData.get("title")),
    subtitle: text(formData.get("subtitle")),
    imageUrl: text(formData.get("imageUrl")),
    linkUrl: text(formData.get("linkUrl")),
  });
  if (!parsed.success) go("erro", "Informe um título (2 a 90 caracteres) e confira os campos.");
  const d = parsed.data;
  if (!safeLink(d.linkUrl)) go("erro", "O link deve começar com / (página da loja) ou https://.");
  if (d.imageUrl && !d.imageUrl.startsWith("https://")) go("erro", "A imagem deve ser um link https.");

  const data = {
    title: d.title,
    subtitle: d.subtitle || null,
    imageUrl: d.imageUrl || null,
    linkUrl: d.linkUrl || null,
    sortOrder: Number.parseInt(text(formData.get("sortOrder")) || "0", 10) || 0,
    active: id ? formData.get("active") === "on" : true,
  };
  if (id) await db.banner.update({ where: { id }, data });
  else await db.banner.create({ data });
  go("ok", "Banner salvo.");
}

export async function deleteBannerAction(bannerId: string) {
  await requireAdmin();
  await db.banner.delete({ where: { id: bannerId } }).catch(() => null);
  go("ok", "Banner removido.");
}
