import { describe, expect, it } from "vitest";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("gera hash que valida a senha correta e rejeita a errada", async () => {
    const password = "senha-forte-de-teste-123";
    const stored = await hashPassword(password);

    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(stored).not.toContain(password);
    expect(await verifyPassword(password, stored)).toBe(true);
    expect(await verifyPassword("outra-senha-errada-1", stored)).toBe(false);
  });

  it("usa salt aleatório: o mesmo texto gera hashes diferentes", async () => {
    const password = "senha-forte-de-teste-123";
    expect(await hashPassword(password)).not.toBe(await hashPassword(password));
  });

  it("recusa senhas curtas", async () => {
    await expect(hashPassword("curta")).rejects.toThrow(String(MIN_PASSWORD_LENGTH));
  });

  it("rejeita formato de hash inválido sem lançar erro", async () => {
    expect(await verifyPassword("qualquer", "lixo")).toBe(false);
  });
}, 30000);
