/**
 * Validação de imagens enviadas pelo painel. Confere o tipo REAL pelo conteúdo (assinatura
 * do arquivo), não só pelo nome ou pelo Content-Type informado pelo navegador.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // abaixo do limite de ~4,5 MB do corpo na Vercel

export type ImageKind = { mime: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" };

export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) {
    return { mime: "image/png", ext: "png" };
  }
  const ascii = (from: number, text: string) => text.split("").every((c, i) => bytes[from + i] === c.charCodeAt(0));
  if (bytes.length >= 12 && ascii(0, "RIFF") && ascii(8, "WEBP")) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

export type ImageCheck =
  | { ok: true; kind: ImageKind }
  | { ok: false; reason: "EMPTY" | "TOO_LARGE" | "UNSUPPORTED" };

export function checkImage(bytes: Uint8Array): ImageCheck {
  if (bytes.length === 0) return { ok: false, reason: "EMPTY" };
  if (bytes.length > MAX_IMAGE_BYTES) return { ok: false, reason: "TOO_LARGE" };
  const kind = sniffImage(bytes);
  return kind ? { ok: true, kind } : { ok: false, reason: "UNSUPPORTED" };
}

export const UPLOAD_ERRORS = {
  EMPTY: "O arquivo está vazio.",
  TOO_LARGE: "A imagem passa de 4 MB. Reduza o tamanho e tente de novo.",
  UNSUPPORTED: "Use uma imagem JPG, PNG ou WebP.",
} as const;
