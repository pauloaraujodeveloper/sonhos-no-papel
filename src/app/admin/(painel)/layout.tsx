import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { logoutAction } from "@/lib/admin/actions/auth";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel Sonhos no Papel" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/estoque", label: "Estoque" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

const ROLE_LABEL = { OWNER: "Proprietária", DEVELOPER: "Desenvolvimento", EDITOR: "Editor" } as const;

async function Shell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-papel">
      <header className="border-b border-borda bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/brand/simbolo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="font-display font-semibold text-marinho">Painel</span>
          </Link>
          <nav aria-label="Painel" className="flex flex-1 flex-wrap gap-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full px-3 py-1.5 text-sm font-semibold text-marinho-texto hover:bg-lilas-soft">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">
              {admin.name} · {ROLE_LABEL[admin.role]}
            </span>
            <Link href="/" target="_blank" className="font-semibold text-marinho-texto hover:underline">
              Ver loja
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="rounded-full border border-borda px-3 py-1.5 font-semibold text-marinho hover:bg-bebe-soft">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export default function PainelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-lilas-soft" aria-busy="true" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
