import { describe, expect, it } from "vitest";
import { buildThemeCss, DEFAULT_THEME, isHexColor, parseTheme } from "./theme";

describe("tema", () => {
  it("aceita só hexadecimal de 6 dígitos", () => {
    expect(isHexColor("#bde3f6")).toBe(true);
    expect(isHexColor("#BDE3F6")).toBe(true);
    expect(isHexColor("red")).toBe(false);
    expect(isHexColor("#fff")).toBe(false);
    expect(isHexColor("#bde3f6; } body { display:none")).toBe(false);
  });

  it("completa com o padrão e descarta valores inválidos", () => {
    const t = parseTheme({ bebe: "#112233", rosa: "javascript:alert(1)", slogan: "  Olá  " });
    expect(t.bebe).toBe("#112233");
    expect(t.rosa).toBe(DEFAULT_THEME.rosa);
    expect(t.marinho).toBe(DEFAULT_THEME.marinho);
    expect(t.slogan).toBe("Olá");
    expect(parseTheme(null)).toEqual(DEFAULT_THEME);
  });

  it("gera CSS apenas com as variáveis da marca", () => {
    const css = buildThemeCss(parseTheme({ bebe: "#112233" }));
    expect(css.startsWith(":root{")).toBe(true);
    expect(css).toContain("--color-bebe:#112233;");
    expect(css).not.toContain("<");
  });
});
