import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Slogan } from "@/components/site/ThemeStyle";
import { SocialLinks } from "@/components/site/SocialLinks";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-borda bg-gradient-to-b from-bebe-soft to-papel">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 text-sm text-muted sm:px-6 md:grid-cols-2 md:items-center">
        <div>
          <Image src="/brand/logo-horizontal.webp" alt={BRAND.name} width={200} height={74} className="mb-3 h-12 w-auto" />
          <p>
            <Suspense fallback={BRAND.slogan}>
              <Slogan />
            </Suspense>
            .
          </p>
          <p className="mt-1">Os pedidos são finalizados pelo WhatsApp.</p>
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <Suspense fallback={null}>
            <SocialLinks />
          </Suspense>
          <nav aria-label="Rodapé" className="flex gap-2 font-semibold text-marinho-texto">
            <Link href="/produtos" className="inline-flex min-h-11 items-center rounded-full px-3 transition-colors duration-300 ease-out hover:bg-lilas-soft">
              Catálogo
            </Link>
            <Link href="/carrinho" className="inline-flex min-h-11 items-center rounded-full px-3 transition-colors duration-300 ease-out hover:bg-lilas-soft">
              Carrinho
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
