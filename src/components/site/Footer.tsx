import Link from "next/link";
import { Suspense } from "react";
import { Slogan } from "@/components/site/ThemeStyle";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-borda bg-bebe-soft">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-base font-semibold text-marinho">{BRAND.name}</p>
          <p>
            <Suspense fallback={BRAND.slogan}>
              <Slogan />
            </Suspense>
            .
          </p>
          <p className="mt-1">Os pedidos são finalizados pelo WhatsApp.</p>
        </div>
        <nav aria-label="Rodapé" className="flex gap-4 font-semibold text-marinho-texto">
          <Link href="/produtos" className="hover:underline">
            Catálogo
          </Link>
          <Link href="/carrinho" className="hover:underline">
            Carrinho
          </Link>
        </nav>
      </div>
    </footer>
  );
}
