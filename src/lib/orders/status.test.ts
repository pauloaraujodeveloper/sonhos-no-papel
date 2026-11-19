import { describe, expect, it } from "vitest";
import { canTransition, ORDER_TRANSITIONS, STOCK_CONSUMED_STATUSES, type OrderStatusKey } from "./status";

describe("transições de pedido", () => {
  it("permite o fluxo normal até a conclusão", () => {
    const flow: OrderStatusKey[] = ["AWAITING_CONFIRMATION", "CONFIRMED", "IN_PREPARATION", "OUT_FOR_DELIVERY", "COMPLETED"];
    for (let i = 0; i < flow.length - 1; i++) {
      expect(canTransition(flow[i], flow[i + 1])).toBe(true);
    }
  });

  it("não permite pular a confirmação nem voltar atrás", () => {
    expect(canTransition("AWAITING_CONFIRMATION", "IN_PREPARATION")).toBe(false);
    expect(canTransition("CONFIRMED", "AWAITING_CONFIRMATION")).toBe(false);
  });

  it("estados finais não têm saída", () => {
    expect(ORDER_TRANSITIONS.COMPLETED).toEqual([]);
    expect(ORDER_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it("pedidos não confirmados não baixam estoque", () => {
    expect(STOCK_CONSUMED_STATUSES).not.toContain("AWAITING_CONFIRMATION");
    expect(STOCK_CONSUMED_STATUSES).not.toContain("NEW");
    expect(STOCK_CONSUMED_STATUSES).toContain("CONFIRMED");
  });
});
