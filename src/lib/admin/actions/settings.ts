"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { SETTINGS_ROLES, requireAdmin } from "@/lib/auth/guard";
import { normalizeWhatsAppNumber } from "@/lib/commerce/whatsapp";
import { parseReaisToCents } from "@/lib/commerce/money";
import { db } from "@/lib/db";

function go(kind: "ok" | "erro", message: string): never {
  redirect(`/admin/configuracoes?${kind}=${encodeURIComponent(message)}`);
}
const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();

const schema = z.object({
  storeName: z.string().min(2).max(80),
  email: z.union([z.literal(""), z.string().email().max(120)]),
  phone: z.string().max(30),
  address: z.string().max(200),
  openingHours: z.string().max(200),
  pickupInstructions: z.string().max(400),
  pixKey: z.string().max(77),
  pixKeyType: z.union([z.literal(""), z.enum(["CPF_CNPJ", "EMAIL", "PHONE", "RANDOM"])]),
  pixReceiverName: z.string().max(25),
  pixBankName: z.string().max(60),
  pixCity: z.string().max(15),
  instagram: z.string().max(120),
});

/** Somente OWNER e DEVELOPER alteram configurações (WhatsApp, Pix e entrega). */
export async function saveSettingsAction(formData: FormData) {
  await requireAdmin({ roles: SETTINGS_ROLES });

  const parsed = schema.safeParse({
    storeName: text(formData.get("storeName")),
    email: text(formData.get("email")),
    phone: text(formData.get("phone")),
    address: text(formData.get("address")),
    openingHours: text(formData.get("openingHours")),
    pickupInstructions: text(formData.get("pickupInstructions")),
    pixKey: text(formData.get("pixKey")),
    pixKeyType: text(formData.get("pixKeyType")),
    pixReceiverName: text(formData.get("pixReceiverName")),
    pixBankName: text(formData.get("pixBankName")),
    pixCity: text(formData.get("pixCity")),
    instagram: text(formData.get("instagram")),
  });
  if (!parsed.success) go("erro", "Confira os campos. Nome do titular até 25 e cidade até 15 caracteres.");

  const whatsappRaw = text(formData.get("whatsappNumber"));
  const whatsapp = whatsappRaw ? normalizeWhatsAppNumber(whatsappRaw) : null;
  if (whatsappRaw && !whatsapp) go("erro", "WhatsApp inválido. Use DDD e número, ex.: (11) 91234-5678.");

  const flatFee = parseReaisToCents(text(formData.get("deliveryFlatFee")) || "0");
  if (flatFee === null) go("erro", "Taxa de entrega inválida.");
  const freeAboveRaw = text(formData.get("deliveryFreeAbove"));
  const freeAbove = freeAboveRaw ? parseReaisToCents(freeAboveRaw) : null;
  if (freeAboveRaw && freeAbove === null) go("erro", "Valor de entrega grátis inválido.");

  const d = parsed.data;
  if (d.pixKey && !d.pixKeyType) go("erro", "Escolha o tipo da chave Pix.");

  const data = {
    storeName: d.storeName,
    email: d.email || null,
    phone: d.phone || null,
    address: d.address || null,
    openingHours: d.openingHours || null,
    pickupInstructions: d.pickupInstructions || null,
    whatsappNumber: whatsapp,
    pixKey: d.pixKey || null,
    pixKeyType: d.pixKeyType || null,
    pixReceiverName: d.pixReceiverName || null,
    pixBankName: d.pixBankName || null,
    pixCity: d.pixCity || null,
    socialLinks: d.instagram ? { instagram: d.instagram } : undefined,
    deliveryFlatFeeCents: flatFee,
    deliveryFreeAboveCents: freeAbove,
  };
  await db.storeSettings.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });
  go("ok", "Configurações salvas.");
}

export async function saveZoneAction(formData: FormData) {
  await requireAdmin({ roles: SETTINGS_ROLES });
  const name = text(formData.get("name"));
  const fee = parseReaisToCents(text(formData.get("fee")) || "0");
  const freeRaw = text(formData.get("freeAbove"));
  const free = freeRaw ? parseReaisToCents(freeRaw) : null;
  if (name.length < 2 || name.length > 80 || fee === null || (freeRaw && free === null)) go("erro", "Informe o bairro/região e valores válidos.");
  await db.deliveryZone.create({ data: { name, feeCents: fee, freeAboveCents: free } });
  go("ok", "Região de entrega adicionada.");
}

export async function deleteZoneAction(zoneId: string) {
  await requireAdmin({ roles: SETTINGS_ROLES });
  await db.deliveryZone.delete({ where: { id: zoneId } }).catch(() => null);
  go("ok", "Região removida.");
}
