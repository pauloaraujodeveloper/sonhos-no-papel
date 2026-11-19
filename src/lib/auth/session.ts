import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sessão administrativa sem estado: token assinado com HMAC-SHA256.
 * Formato: base64url(payload JSON).base64url(assinatura)
 * O usuário continua sendo validado no banco a cada requisição (ativo, papel atual).
 */

export const SESSION_COOKIE = "snp_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

export interface SessionPayload {
  /** ID do AdminUser. */
  sub: string;
  /** Expiração, em segundos desde a época. */
  exp: number;
}

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET ausente ou curto (mínimo 32 caracteres).");
  }
  return value;
}

const b64 = (input: Buffer | string) => Buffer.from(input).toString("base64url");

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createSessionToken(userId: string, now = Date.now()): string {
  const payload: SessionPayload = { sub: userId, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS };
  const body = b64(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): SessionPayload | null {
  if (!token) return null;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 <= now) return null;
    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}
