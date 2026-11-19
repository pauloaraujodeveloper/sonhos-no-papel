import { formatBRL, type PricedLine } from "./pricing";

/**
 * Integração com WhatsApp via link oficial wa.me.
 * Formato: https://wa.me/<número com DDI e DDD, só dígitos>?text=<mensagem codificada>
 */

export function normalizeWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // Números brasileiros: DDI 55 + DDD (2) + número (8 ou 9 dígitos).
  if (/^55\d{10,11}$/.test(digits)) return digits;
  // Aceita DDD + número sem DDI e adiciona o DDI do Brasil.
  if (/^\d{10,11}$/.test(digits)) return `55${digits}`;
  return null;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) {
    throw new Error("Número de WhatsApp inválido.");
  }
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export interface OrderMessageInput {
  /** Número inteiro do pedido; exibido como SP-0001 (PRD RF-007). */
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  lines: PricedLine[];
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  fulfillment: "PICKUP" | "DELIVERY";
  /** Endereço formatado, obrigatório quando fulfillment === "DELIVERY". */
  address?: string | null;
  notes?: string | null;
}

export interface OwnerReplyInput {
  orderNumber: number;
  customerName: string;
  totalCents: number;
  /** Dados do Pix cadastrados em Configurações (opcionais). */
  pix?: { key: string; receiverName?: string | null; bankName?: string | null } | null;
}

/** Mensagem inicial que a proprietária envia ao cliente para combinar o pagamento via Pix. */
export function buildOwnerReplyMessage(input: OwnerReplyInput): string {
  const lines = [
    `Olá, ${input.customerName}! Aqui é da Sonhos no Papel.`,
    `Recebemos o seu pedido ${formatOrderCode(input.orderNumber)} no valor de ${formatBRL(input.totalCents)}.`,
  ];
  if (input.pix?.key) {
    lines.push("", "Para pagar via Pix:", `Chave: ${input.pix.key}`);
    if (input.pix.receiverName) lines.push(`Titular: ${input.pix.receiverName}`);
    if (input.pix.bankName) lines.push(`Banco: ${input.pix.bankName}`);
    lines.push("", "Depois do pagamento, envie o comprovante por aqui, por favor.");
  } else {
    lines.push("", "Já já enviamos os dados para pagamento.");
  }
  return lines.join("\n");
}

export function formatOrderCode(orderNumber: number): string {
  return `SP-${String(orderNumber).padStart(4, "0")}`;
}

/** Monta a mensagem do pedido em texto simples, pronta para o WhatsApp (PRD RF-007). */
export function buildOrderMessage(input: OrderMessageInput): string {
  const itemLines = input.lines.map((line, index) => {
    const name = line.variantName ? `${line.productName} (${line.variantName})` : line.productName;
    const unit = formatBRL(line.unitPriceCents);
    return [
      `${index + 1}. ${name}`,
      `   Quantidade: ${line.quantity} x ${unit}`,
      `   Subtotal do item: ${formatBRL(line.lineTotalCents)}`,
    ].join("\n");
  });

  const receiving =
    input.fulfillment === "PICKUP" ? "Retirada na loja" : "Entrega";

  const sections = [
    `Olá! Gostaria de realizar um pedido na Sonhos no Papel.`,
    "",
    `*Pedido:* ${formatOrderCode(input.orderNumber)}`,
    "",
    "*Produtos*",
    itemLines.join("\n"),
    "",
    `*Subtotal:* ${formatBRL(input.subtotalCents)}`,
    `*Descontos:* ${input.discountCents > 0 ? `-${formatBRL(input.discountCents)}` : formatBRL(0)}`,
    `*Entrega:* ${input.fulfillment === "PICKUP" ? "Sem taxa (retirada)" : formatBRL(input.deliveryFeeCents)}`,
    `*Total:* ${formatBRL(input.totalCents)}`,
    "",
    `*Recebimento:* ${receiving}`,
    `*Cliente:* ${input.customerName}`,
    `*Telefone:* ${input.customerPhone}`,
  ];

  if (input.fulfillment === "DELIVERY" && input.address) {
    sections.push(`*Endereço:* ${input.address}`);
  }

  if (input.notes && input.notes.trim()) {
    sections.push(`*Observações:* ${input.notes.trim()}`);
  }

  sections.push("", "Aguardo as informações para pagamento via Pix. Obrigado!");

  return sections.join("\n");
}
