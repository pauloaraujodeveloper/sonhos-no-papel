/**
 * Endereço público do site (NEXT_PUBLIC_SITE_URL). Tolera espaços/quebras de linha e valores
 * inválidos: nesses casos usa localhost, em vez de derrubar o build.
 */
function resolve(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  try {
    return new URL(raw || "http://localhost:3000").origin;
  } catch {
    return "http://localhost:3000";
  }
}

export const SITE_URL = resolve();
