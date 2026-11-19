import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { parseTheme } from "@/lib/theme";

/** Tema salvo no painel, lido uma vez por requisição. */
export const getTheme = cache(async () => {
  const settings = await db.storeSettings.findUnique({ where: { id: "default" }, select: { theme: true } });
  return parseTheme(settings?.theme);
});
