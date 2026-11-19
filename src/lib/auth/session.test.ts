import { beforeAll, describe, expect, it } from "vitest";
import { createSessionToken, SESSION_TTL_SECONDS, verifySessionToken } from "./session";

beforeAll(() => {
  process.env.SESSION_SECRET = "segredo-de-teste-com-mais-de-trinta-e-dois-caracteres";
});

describe("sessão administrativa", () => {
  it("valida um token recém-criado", () => {
    const token = createSessionToken("user-1");
    expect(verifySessionToken(token)?.sub).toBe("user-1");
  });

  it("rejeita token adulterado", () => {
    const token = createSessionToken("user-1");
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "outro", exp: 9999999999 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`)).toBeNull();
    expect(verifySessionToken(`${body}.${sig}x`)).toBeNull();
    expect(verifySessionToken("lixo")).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
  });

  it("rejeita token expirado", () => {
    const now = Date.now();
    const token = createSessionToken("user-1", now);
    expect(verifySessionToken(token, now + (SESSION_TTL_SECONDS + 1) * 1000)).toBeNull();
  });

  it("rejeita token assinado com outro segredo", () => {
    const token = createSessionToken("user-1");
    process.env.SESSION_SECRET = "outro-segredo-completamente-diferente-do-primeiro-1234";
    expect(verifySessionToken(token)).toBeNull();
    process.env.SESSION_SECRET = "segredo-de-teste-com-mais-de-trinta-e-dois-caracteres";
  });
});
