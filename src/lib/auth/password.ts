import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

/**
 * Hash de senhas com scrypt (módulo nativo do Node, sem dependência extra).
 * Formato armazenado: scrypt$N$r$p$salt_base64$hash_base64
 * PRD v1.2 cita hash seguro; trocar por Argon2id quando a dependência for adotada.
 */

const KEY_LENGTH = 64;
const COST = { N: 2 ** 15, r: 8, p: 1 } as const;
export const MIN_PASSWORD_LENGTH = 12;

function deriveKey(password: string, salt: Buffer, N: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, { N, r, p, maxmem: 128 * N * r * 2 }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, COST.N, COST.r, COST.p);
  return [
    "scrypt",
    COST.N,
    COST.r,
    COST.p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (![N, r, p].every(Number.isSafeInteger)) return false;

  const expected = Buffer.from(hashB64, "base64");
  const actual = await deriveKey(password, Buffer.from(saltB64, "base64"), N, r, p);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
