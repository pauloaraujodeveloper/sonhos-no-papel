import { describe, expect, it } from "vitest";
import { instagramUrl } from "./social";

describe("instagramUrl", () => {
  it("aceita @usuário, usuário e links do Instagram", () => {
    const expected = "https://www.instagram.com/sonhosnopapel/";
    expect(instagramUrl("@sonhosnopapel")).toBe(expected);
    expect(instagramUrl("sonhosnopapel")).toBe(expected);
    expect(instagramUrl("instagram.com/sonhosnopapel")).toBe(expected);
    expect(instagramUrl("https://www.instagram.com/sonhosnopapel/?hl=pt-br")).toBe(expected);
  });

  it("rejeita vazio, outros domínios e esquemas perigosos", () => {
    expect(instagramUrl("")).toBeNull();
    expect(instagramUrl(null)).toBeNull();
    expect(instagramUrl("https://exemplo.com/sonhosnopapel")).toBeNull();
    expect(instagramUrl("javascript:alert(1)")).toBeNull();
    expect(instagramUrl("https://instagram.com.evil.com/x")).toBeNull();
  });
});
