import { BRAND } from "@/lib/brand";
import { buildThemeCss } from "@/lib/theme";
import { getTheme } from "@/lib/theme-server";

/** Aplica as cores escolhidas no painel (Aparência). O CSS vem só de valores #rrggbb validados. */
export async function ThemeStyle() {
  const theme = await getTheme();
  return <style dangerouslySetInnerHTML={{ __html: buildThemeCss(theme) }} />;
}

/** Assinatura da marca (editável no painel); enquanto carrega, mostra a padrão. */
export async function Slogan() {
  const theme = await getTheme();
  return <>{theme.slogan || BRAND.slogan}</>;
}
