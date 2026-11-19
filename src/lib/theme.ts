/**
 * Aparência editável pelo painel (PRD RF-014): cores da marca e assinatura.
 * Fica em StoreSettings.theme (JSON). Só aceita cores em hexadecimal (#rrggbb),
 * o que impede injeção de CSS pelo painel.
 */
export type Theme = {
  /** Azul-bebê (fundos e destaques suaves). */
  bebe: string;
  /** Lilás (cartões e detalhes). */
  lilas: string;
  /** Rosa (selos e detalhes). */
  rosa: string;
  /** Azul-marinho (títulos e botões principais). */
  marinho: string;
  /** Cor de destaque de links e botões do BoardUI. */
  destaque: string;
  /** Assinatura da marca; vazio usa a padrão. */
  slogan: string;
};

export const DEFAULT_THEME: Theme = {
  bebe: "#bde3f6",
  lilas: "#d3c3f1",
  rosa: "#ee95b8",
  marinho: "#2e2459",
  destaque: "#54438e",
  slogan: "",
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

/** Lê o JSON salvo, ignorando valores inválidos e completando com o padrão. */
export function parseTheme(raw: unknown): Theme {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const color = (key: keyof Omit<Theme, "slogan">) => (isHexColor(src[key]) ? (src[key] as string).toLowerCase() : DEFAULT_THEME[key]);
  const slogan = typeof src.slogan === "string" ? src.slogan.trim().slice(0, 90) : "";
  return {
    bebe: color("bebe"),
    lilas: color("lilas"),
    rosa: color("rosa"),
    marinho: color("marinho"),
    destaque: color("destaque"),
    slogan,
  };
}

/**
 * CSS que sobrescreve os tokens da marca. As versões "suaves" são derivadas das cores base
 * (mistura com branco), então o painel só pede cinco cores.
 */
export function buildThemeCss(theme: Theme): string {
  const soft = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, white)`;
  return [
    ":root{",
    `--color-bebe:${theme.bebe};`,
    `--color-bebe-soft:${soft(theme.bebe, 28)};`,
    `--color-lilas:${theme.lilas};`,
    `--color-lilas-soft:${soft(theme.lilas, 28)};`,
    `--color-rosa:${theme.rosa};`,
    `--color-rosa-soft:${soft(theme.rosa, 35)};`,
    `--color-marinho:${theme.marinho};`,
    `--color-marinho-texto:${theme.destaque};`,
    `--color-accent-600:${theme.destaque};`,
    `--color-accent-700:color-mix(in srgb, ${theme.destaque} 85%, black);`,
    `--color-accent-500:color-mix(in srgb, ${theme.destaque} 80%, white);`,
    "}",
  ].join("");
}
