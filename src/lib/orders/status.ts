/**
 * Estados de pedido e pagamento (PRD v1.2, seção 8) e transições permitidas.
 * Módulo puro, seguro para uso no servidor e no cliente.
 */

export type OrderStatusKey =
  | "NEW"
  | "AWAITING_CONFIRMATION"
  | "CONFIRMED"
  | "IN_PREPARATION"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatusKey =
  | "NOT_INFORMED"
  | "AWAITING_PAYMENT"
  | "UNDER_REVIEW"
  | "PAID"
  | "CANCELLED"
  | "REFUNDED";

export const ORDER_STATUS_LABEL: Record<OrderStatusKey, string> = {
  NEW: "Novo pedido",
  AWAITING_CONFIRMATION: "Aguardando confirmação",
  CONFIRMED: "Confirmado",
  IN_PREPARATION: "Em preparação",
  READY_FOR_PICKUP: "Pronto para retirada",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatusKey, string> = {
  NOT_INFORMED: "Não informado",
  AWAITING_PAYMENT: "Aguardando pagamento",
  UNDER_REVIEW: "Em análise",
  PAID: "Pago",
  CANCELLED: "Cancelado",
  REFUNDED: "Estornado",
};

export const ORDER_TRANSITIONS: Record<OrderStatusKey, OrderStatusKey[]> = {
  NEW: ["AWAITING_CONFIRMATION", "CONFIRMED", "CANCELLED"],
  AWAITING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PREPARATION", "CANCELLED"],
  IN_PREPARATION: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_PICKUP: ["COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatusKey, to: OrderStatusKey): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Estados em que o estoque físico já foi baixado (pedido confirmado pela proprietária). */
export const STOCK_CONSUMED_STATUSES: OrderStatusKey[] = [
  "CONFIRMED",
  "IN_PREPARATION",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
];

/** Pagamentos manuais que a proprietária pode registrar sem passar pela confirmação. */
export const MANUAL_PAYMENT_STATUSES: PaymentStatusKey[] = [
  "AWAITING_PAYMENT",
  "UNDER_REVIEW",
  "CANCELLED",
  "REFUNDED",
];
