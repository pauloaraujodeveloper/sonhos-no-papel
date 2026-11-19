import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAdmin } from "@/lib/auth/guard";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Entrar no painel",
  robots: { index: false, follow: false },
};

async function RedirectIfLoggedIn() {
  if (await getAdmin()) redirect("/admin");
  return null;
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bebe-soft px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-borda bg-white p-8 shadow-suave">
        <div className="flex flex-col items-center gap-2 text-center">
          <Image src="/brand/logo-completa.webp" alt="Sonhos no Papel" width={140} height={164} className="h-auto w-28" priority />
          <h1 className="font-display text-xl font-semibold text-marinho">Painel administrativo</h1>
          <p className="text-sm text-muted">Acesso restrito à administração.</p>
        </div>
        <Suspense fallback={null}>
          <RedirectIfLoggedIn />
        </Suspense>
        <LoginForm />
      </div>
    </main>
  );
}
