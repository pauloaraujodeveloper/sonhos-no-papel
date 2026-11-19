import { describe, expect, it } from "vitest";
import {
  buildPixPayload,
  crc16Ccitt,
  formatAmountForBrCode,
  hasValidPixCrc,
  isValidTxid,
  PixPayloadError,
  sanitizeBrCodeText,
} from "./pix";

/** Lê um payload EMV (TLV) em um mapa de id -> valor, sem recursão. */
function parseTlv(payload: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    fields[id] = payload.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return fields;
}

const base = {
  pixKey: "contato@sonhosnopapel.com.br",
  receiverName: "Sonhos no Papel",
  city: "São Paulo",
  amountCents: 7000,
  txid: "PEDIDO2026000123",
};

describe("crc16Ccitt", () => {
  it("corresponde ao valor de verificação CRC-16/CCITT-FALSE", () => {
    expect(crc16Ccitt("123456789")).toBe("29B1");
  });
});

describe("formatAmountForBrCode", () => {
  it("converte centavos inteiros sem erro de ponto flutuante", () => {
    expect(formatAmountForBrCode(7000)).toBe("70.00");
    expect(formatAmountForBrCode(1)).toBe("0.01");
    expect(formatAmountForBrCode(123456)).toBe("1234.56");
  });

  it("rejeita valores não positivos ou não inteiros", () => {
    expect(() => formatAmountForBrCode(0)).toThrow(PixPayloadError);
    expect(() => formatAmountForBrCode(-100)).toThrow(PixPayloadError);
    expect(() => formatAmountForBrCode(10.5)).toThrow(PixPayloadError);
  });
});

describe("buildPixPayload", () => {
  it("gera payload com valor exato, txid e CRC válido", () => {
    const payload = buildPixPayload(base);
    const fields = parseTlv(payload.slice(0, -8));

    expect(fields["00"]).toBe("01");
    expect(fields["01"]).toBe("12");
    expect(fields["54"]).toBe("70.00");
    expect(fields["53"]).toBe("986");
    expect(fields["58"]).toBe("BR");
    expect(fields["59"]).toBe("SONHOS NO PAPEL");
    expect(fields["60"]).toBe("SAO PAULO");
    expect(fields["62"]).toBe("0516PEDIDO2026000123");
    expect(payload.slice(-8, -4)).toBe("6304");
    expect(hasValidPixCrc(payload)).toBe(true);
  });

  it("inclui a chave Pix dentro do bloco 26 (Merchant Account Information)", () => {
    const payload = buildPixPayload(base);
    const merchant = parseTlv(payload.slice(0, -8))["26"];
    const sub = parseTlv(merchant);
    expect(sub["00"]).toBe("br.gov.bcb.pix");
    expect(sub["01"]).toBe(base.pixKey);
  });

  it("altera o CRC quando qualquer campo muda", () => {
    const a = buildPixPayload(base);
    const b = buildPixPayload({ ...base, amountCents: 7001 });
    expect(a).not.toBe(b);
    expect(hasValidPixCrc(b)).toBe(true);
  });

  it("detecta payload adulterado", () => {
    const payload = buildPixPayload(base);
    // Campo 54 (valor) é "0570.00"-> alterado para 75,00 sem recalcular o CRC.
    const tampered = payload.replace("540570.00", "540575.00");
    expect(tampered).not.toBe(payload);
    expect(hasValidPixCrc(tampered)).toBe(false);
  });

  it("rejeita txid inválido e chave ausente", () => {
    expect(() => buildPixPayload({ ...base, txid: "PEDIDO-1" })).toThrow(PixPayloadError);
    expect(() => buildPixPayload({ ...base, txid: "" })).toThrow(PixPayloadError);
    expect(() => buildPixPayload({ ...base, pixKey: "  " })).toThrow(PixPayloadError);
  });
});

describe("sanitizeBrCodeText", () => {
  it("remove acentos, normaliza caixa e respeita o tamanho máximo", () => {
    expect(sanitizeBrCodeText("Ateliê São João", 25)).toBe("ATELIE SAO JOAO");
    expect(sanitizeBrCodeText("Sonhos no Papel da Ana Clara Ferreira", 25)).toHaveLength(25);
  });
});

describe("isValidTxid", () => {
  it("aceita somente alfanuméricos de 1 a 25 caracteres", () => {
    expect(isValidTxid("ABC123")).toBe(true);
    expect(isValidTxid("A".repeat(25))).toBe(true);
    expect(isValidTxid("A".repeat(26))).toBe(false);
    expect(isValidTxid("AB-12")).toBe(false);
  });
});
