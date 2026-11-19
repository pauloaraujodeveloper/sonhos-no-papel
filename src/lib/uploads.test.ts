import { describe, expect, it } from "vitest";
import { checkImage, MAX_IMAGE_BYTES, sniffImage } from "./uploads";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);

describe("sniffImage", () => {
  it("reconhece JPG, PNG e WebP pelo conteúdo", () => {
    expect(sniffImage(jpeg)?.ext).toBe("jpg");
    expect(sniffImage(png)?.ext).toBe("png");
    expect(sniffImage(webp)?.ext).toBe("webp");
  });

  it("rejeita outros tipos, mesmo com nome de imagem (ex.: HTML, SVG, executável)", () => {
    expect(sniffImage(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<html><script>alert(1)</script>"))).toBeNull();
    expect(sniffImage(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toBeNull();
  });
});

describe("checkImage", () => {
  it("valida tamanho e tipo", () => {
    expect(checkImage(jpeg).ok).toBe(true);
    expect(checkImage(new Uint8Array(0))).toEqual({ ok: false, reason: "EMPTY" });
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
    big.set(jpeg);
    expect(checkImage(big)).toEqual({ ok: false, reason: "TOO_LARGE" });
    expect(checkImage(new Uint8Array([1, 2, 3, 4]))).toEqual({ ok: false, reason: "UNSUPPORTED" });
  });
});
