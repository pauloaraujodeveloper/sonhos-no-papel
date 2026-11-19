import { describe, expect, it } from "vitest";
import { assertOnlinePixEnabled, FeatureDisabledError, isOnlinePixEnabled } from "./features";

describe("feature flag ONLINE_PIX_ENABLED", () => {
  it("fica desligada por padrão", () => {
    expect(isOnlinePixEnabled({})).toBe(false);
  });

  it("aceita somente o valor exato 'true'", () => {
    expect(isOnlinePixEnabled({ ONLINE_PIX_ENABLED: "true" })).toBe(true);
    expect(isOnlinePixEnabled({ ONLINE_PIX_ENABLED: "TRUE" })).toBe(false);
    expect(isOnlinePixEnabled({ ONLINE_PIX_ENABLED: "1" })).toBe(false);
  });

  it("impede operações de cobrança quando desligada", () => {
    expect(() => assertOnlinePixEnabled({ ONLINE_PIX_ENABLED: "false" })).toThrow(
      FeatureDisabledError,
    );
  });
});
