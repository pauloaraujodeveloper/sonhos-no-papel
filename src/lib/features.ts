/**
 * Controle centralizado de funcionalidades (PRD seção 10 — feature flag).
 *
 * O Pix online fica DESABILITADO no MVP. A interface e o backend devem consultar
 * estas funções; não basta ocultar botões. Serviços de cobrança devem chamar
 * `assertOnlinePixEnabled()` antes de qualquer operação com provedor.
 */

export class FeatureDisabledError extends Error {
  constructor(feature: string) {
    super(`Funcionalidade desabilitada: ${feature}`);
    this.name = "FeatureDisabledError";
  }
}

type EnvLike = Record<string, string | undefined>;

/** Lê ONLINE_PIX_ENABLED. Qualquer valor diferente de "true" mantém a flag desligada. */
export function isOnlinePixEnabled(env: EnvLike = process.env): boolean {
  return env.ONLINE_PIX_ENABLED === "true";
}

export function assertOnlinePixEnabled(env: EnvLike = process.env): void {
  if (!isOnlinePixEnabled(env)) {
    throw new FeatureDisabledError("pagamento Pix online");
  }
}
