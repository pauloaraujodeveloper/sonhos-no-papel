"use server";

import { redirect } from "next/navigation";
import { SETTINGS_ROLES, requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { DEFAULT_THEME, isHexColor, type Theme } from "@/lib/theme";

function go(kind: "ok" | "erro", message: string): never {
  redirect(`/admin/aparencia?${kind}=${encodeURIComponent(message)}`);
}

const KEYS = ["bebe", "lilas", "rosa", "marinho", "destaque"] as const;

export async function saveThemeAction(formData: FormData) {
  await requireAdmin({ roles: SETTINGS_ROLES });

  const theme: Theme = { ...DEFAULT_THEME };
  for (const key of KEYS) {
    const value = String(formData.get(key) ?? "").trim();
    if (!isHexColor(value)) go("erro", "Use cores no formato #rrggbb.");
    theme[key] = value.toLowerCase();
  }
  theme.slogan = String(formData.get("slogan") ?? "").trim().slice(0, 90);

  // Botão "Restaurar padrão" limpa tudo.
  const value = formData.get("restore") === "1" ? { ...DEFAULT_THEME } : theme;
  await db.storeSettings.upsert({
    where: { id: "default" },
    create: { id: "default", theme: value },
    update: { theme: value },
  });
  go("ok", formData.get("restore") === "1" ? "Aparência restaurada ao padrão." : "Aparência salva. A loja já usa as novas cores.");
}
