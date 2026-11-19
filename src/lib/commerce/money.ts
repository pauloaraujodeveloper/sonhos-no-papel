/**
 * Converte texto em reais ("12,50", "R$ 1.234,56", "10") para centavos inteiros.
 * Retorna null para vazio ou inválido. Aceita vírgula ou ponto como separador decimal.
 */
export function parseReaisToCents(input: string | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  let text = input.trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (!text) return null;

  if (text.includes(",")) {
    // Formato brasileiro: ponto separa milhares, vírgula separa decimais.
    text = text.replace(/\./g, "").replace(",", ".");
  } else if ((text.match(/\./g) ?? []).length > 1) {
    return null;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;

  const [reais, cents = ""] = text.split(".");
  const value = Number(reais) * 100 + Number(cents.padEnd(2, "0"));
  return Number.isSafeInteger(value) ? value : null;
}

/** Centavos para texto editável em formulários: 1250 -> "12,50". */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}

/** Gera slug em minúsculas, sem acentos, para URLs amigáveis. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
