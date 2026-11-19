/**
 * Gerador de payload Pix (BR Code / EMV QRCPS-MPM) conforme o manual do Banco Central.
 *
 * Gera um código "Pix Copia e Cola" novo para cada pedido, com o valor exato
 * e um identificador de transação (txid). O resultado é o conteúdo que deve ser
 * codificado em QR Code. Não é uma imagem estática reaproveitada.
 *
 * Este módulo é puro (sem I/O). Os dados do recebedor vêm das configurações
 * do painel administrativo e o valor é calculado no servidor.
 *
 * STANDBY (PRD v1.2, RF-009): no MVP o site NÃO gera cobranças Pix. A chave Pix
 * é enviada pela proprietária via WhatsApp. Este gerador só pode ser usado pelo
 * módulo de pagamentos quando ONLINE_PIX_ENABLED=true (ver lib/config/features.ts).
 */

const PIX_GUI = "br.gov.bcb.pix";

/** Limites definidos pelo manual BR Code do BCB. */
export const PIX_LIMITS = {
  keyMaxLength: 77,
  descriptionMaxLength: 72,
  receiverNameMaxLength: 25,
  cityMaxLength: 15,
  txidMaxLength: 25,
  maxAmountCents: 99_999_999_99, // R$ 99.999.999,99
} as const;

export class PixPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PixPayloadError";
  }
}

export interface BuildPixPayloadInput {
  /** Chave Pix do recebedor (CPF/CNPJ, e-mail, telefone ou chave aleatória). */
  pixKey: string;
  /** Nome do recebedor, como deve aparecer para o pagador. */
  receiverName: string;
  /** Cidade do recebedor. */
  city: string;
  /** Valor em centavos (inteiro). Ex.: 7000 = R$ 70,00. */
  amountCents: number;
  /** Identificador da transação (1 a 25 caracteres alfanuméricos). */
  txid: string;
  /** Descrição opcional exibida ao pagador pelo app do banco. */
  description?: string;
}

/** Remove acentos e caracteres fora do conjunto aceito pelo BR Code. */
export function sanitizeBrCodeText(value: string, maxLength: number): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function tlv(id: string, value: string): string {
  const length = value.length;
  if (length > 99) {
    throw new PixPayloadError(`Campo ${id} excede 99 caracteres.`);
  }
  return `${id}${String(length).padStart(2, "0")}${value}`;
}

/** Formata centavos inteiros como texto decimal com ponto (ex.: 7000 -> "70.00"). */
export function formatAmountForBrCode(amountCents: number): string {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new PixPayloadError("O valor do Pix deve ser um inteiro positivo em centavos.");
  }
  if (amountCents > PIX_LIMITS.maxAmountCents) {
    throw new PixPayloadError("Valor acima do limite permitido pelo BR Code.");
  }
  const reais = Math.floor(amountCents / 100);
  const cents = amountCents % 100;
  return `${reais}.${String(cents).padStart(2, "0")}`;
}

/**
 * CRC-16/CCITT-FALSE (polinômio 0x1021, valor inicial 0xFFFF, sem reflexão).
 * Retorna quatro dígitos hexadecimais maiúsculos.
 * Verificação: crc16("123456789") === "29B1".
 */
export function crc16Ccitt(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Valida o txid (somente letras e números, até 25 caracteres). */
export function isValidTxid(txid: string): boolean {
  return /^[A-Za-z0-9]{1,25}$/.test(txid);
}

/**
 * Monta o payload Pix "Copia e Cola" com valor e txid, já com o CRC16 ao final.
 * Usa iniciação dinâmica (campo 01 = "12"), pois o valor é específico do pedido.
 */
export function buildPixPayload(input: BuildPixPayloadInput): string {
  const key = input.pixKey.trim();
  if (!key || key.length > PIX_LIMITS.keyMaxLength) {
    throw new PixPayloadError("Chave Pix ausente ou inválida.");
  }

  const receiverName = sanitizeBrCodeText(input.receiverName, PIX_LIMITS.receiverNameMaxLength);
  const city = sanitizeBrCodeText(input.city, PIX_LIMITS.cityMaxLength);
  if (!receiverName) throw new PixPayloadError("Nome do recebedor é obrigatório.");
  if (!city) throw new PixPayloadError("Cidade do recebedor é obrigatória.");
  if (!isValidTxid(input.txid)) {
    throw new PixPayloadError("txid inválido: use de 1 a 25 letras ou números.");
  }

  const description = input.description
    ? sanitizeBrCodeText(input.description, PIX_LIMITS.descriptionMaxLength)
    : "";

  const merchantAccount =
    tlv("00", PIX_GUI) + tlv("01", key) + (description ? tlv("02", description) : "");

  const additionalData = tlv("05", input.txid);

  const body =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("26", merchantAccount) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", formatAmountForBrCode(input.amountCents)) +
    tlv("58", "BR") +
    tlv("59", receiverName) +
    tlv("60", city) +
    tlv("62", additionalData);

  const withCrcHeader = body + "6304";
  return withCrcHeader + crc16Ccitt(withCrcHeader);
}

/** Confere se um payload Pix tem CRC válido (útil em testes e na validação de entrada). */
export function hasValidPixCrc(payload: string): boolean {
  if (payload.length < 8) return false;
  const crcValue = payload.slice(-4);
  const headerEnd = payload.length - 4;
  if (payload.slice(headerEnd - 4, headerEnd) !== "6304") return false;
  return crc16Ccitt(payload.slice(0, headerEnd)) === crcValue.toUpperCase();
}
