import { describe, expect, it } from "vitest";
import { centsToInput, parseReaisToCents, slugify } from "./money";

describe("parseReaisToCents", () => {
  it("converte formatos comuns", () => {
    expect(parseReaisToCents("10")).toBe(1000);
    expect(parseReaisToCents("12,5")).toBe(1250);
    expect(parseReaisToCents("12,50")).toBe(1250);
    expect(parseReaisToCents("12.50")).toBe(1250);
    expect(parseReaisToCents("R$ 1.234,56")).toBe(123456);
    expect(parseReaisToCents("0,99")).toBe(99);
  });

  it("rejeita vazio e valores inválidos", () => {
    expect(parseReaisToCents("")).toBeNull();
    expect(parseReaisToCents(null)).toBeNull();
    expect(parseReaisToCents("abc")).toBeNull();
    expect(parseReaisToCents("-5")).toBeNull();
    expect(parseReaisToCents("1,234")).toBeNull();
    expect(parseReaisToCents("1.2.3")).toBeNull();
  });
});

describe("centsToInput", () => {
  it("formata para edição", () => {
    expect(centsToInput(1250)).toBe("12,50");
    expect(centsToInput(5)).toBe("0,05");
    expect(centsToInput(null)).toBe("");
  });
});

describe("slugify", () => {
  it("remove acentos e símbolos", () => {
    expect(slugify("Caderno Pontilhado A5 – 90g!")).toBe("caderno-pontilhado-a5-90g");
    expect(slugify("Pincéis & Lápis")).toBe("pinceis-lapis");
  });
});
