"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { endSession, startSession } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { checkLoginAttempt, clearLoginAttempts, recordFailedLogin } from "@/lib/auth/rate-limit";

export interface LoginState {
  error?: string;
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

let dummyHash: Promise<string> | null = null;

export async function loginAction(_prev: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Informe e-mail e senha válidos." };
  const { email, password } = parsed.data;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${email}|${ip}`;

  const limit = checkLoginAttempt(key);
  if (!limit.allowed) {
    return { error: `Muitas tentativas. Tente novamente em ${Math.ceil(limit.retryAfterSeconds / 60)} minuto(s).` };
  }

  const user = await db.adminUser.findUnique({ where: { email } });
  // Verifica sempre um hash para manter o tempo de resposta parecido quando o e-mail não existe.
  dummyHash ??= hashPassword("senha-ficticia-para-tempo-constante");
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));

  if (!user || !user.active || !ok) {
    recordFailedLogin(key);
    return { error: "E-mail ou senha incorretos." };
  }

  clearLoginAttempts(key);
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSession(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}
