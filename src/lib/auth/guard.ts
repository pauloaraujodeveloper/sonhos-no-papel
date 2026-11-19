import "server-only";
import type { AdminRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, verifySessionToken } from "./session";

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

/** Quem pode alterar configurações técnicas e financeiras da loja. */
export const SETTINGS_ROLES: AdminRole[] = ["OWNER", "DEVELOPER"];

/** Lê a sessão do cookie e confirma no banco que o usuário existe e está ativo. */
export async function getAdmin(): Promise<AdminSession | null> {
  const store = await cookies();
  const payload = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const user = await db.adminUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/**
 * Exige administrador autenticado. Deve ser chamado em TODA página e Server Action do painel:
 * o layout sozinho não protege as Server Actions.
 */
export async function requireAdmin(options: { roles?: AdminRole[] } = {}): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (options.roles && !options.roles.includes(admin.role)) redirect("/admin?negado=1");
  return admin;
}

export async function startSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
