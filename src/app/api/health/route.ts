import { connection, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Verificação de saúde dos serviços Neon ligados ao app.
 * - Postgres: consulta simples pela conexão pooled (DATABASE_URL) via Prisma.
 * - Neon Auth: confirma que o endpoint JWKS responde com chaves públicas.
 * A resposta não inclui URLs, credenciais nem detalhes internos.
 */
type CheckResult = { ok: boolean; latencyMs: number; detail?: string };

async function checkDatabase(): Promise<CheckResult> {
  const started = performance.now();
  try {
    const rows = await db.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    return { ok: rows[0]?.ok === 1, latencyMs: Math.round(performance.now() - started) };
  } catch {
    return { ok: false, latencyMs: Math.round(performance.now() - started), detail: "falha na conexão" };
  }
}

async function checkNeonAuth(): Promise<CheckResult> {
  const started = performance.now();
  const url = process.env.NEON_AUTH_JWKS_URL;
  if (!url) {
    return { ok: false, latencyMs: 0, detail: "NEON_AUTH_JWKS_URL não configurada" };
  }
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const body = (await response.json()) as { keys?: unknown[] };
    const ok = response.ok && Array.isArray(body.keys) && body.keys.length > 0;
    return { ok, latencyMs: Math.round(performance.now() - started) };
  } catch {
    return { ok: false, latencyMs: Math.round(performance.now() - started), detail: "falha ao consultar JWKS" };
  }
}

export async function GET() {
  // Indica ao Next que a resposta depende do momento da requisição (sem cache).
  await connection();
  const [database, auth] = await Promise.all([checkDatabase(), checkNeonAuth()]);
  const healthy = database.ok && auth.ok;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      services: { postgres: database, neonAuth: auth },
      checkedAt: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
