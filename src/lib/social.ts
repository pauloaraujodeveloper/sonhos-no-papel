/**
 * Link do Instagram a partir do que a proprietária digitar nas Configurações:
 * "@sonhosnopapel", "sonhosnopapel", "instagram.com/sonhosnopapel" ou o link completo.
 * Só devolve endereços do próprio Instagram (https), nunca outros domínios.
 */
export function instagramUrl(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  const HANDLE = /^[A-Za-z0-9._]{1,30}$/;
  const bare = raw.replace(/^@/, "");
  if (HANDLE.test(bare)) return `https://www.instagram.com/${bare}/`;

  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "instagram.com") return null;
    const user = url.pathname.split("/").filter(Boolean)[0];
    return user && HANDLE.test(user) ? `https://www.instagram.com/${user}/` : null;
  } catch {
    return null;
  }
}
