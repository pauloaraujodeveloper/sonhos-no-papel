"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useCartCount } from "@/lib/cart/store";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Produtos" },
];

const linkBase = "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors";

/** Links com destaque da página atual. Usa o pathname, que só existe em tempo de requisição. */
function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${linkBase} ${active ? "bg-lilas-soft text-marinho" : "text-marinho-texto hover:bg-bebe-soft"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function Header() {
  const count = useCartCount();

  return (
    <header className="sticky top-0 z-30 border-b border-borda bg-papel/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Sonhos no Papel — página inicial">
          <Image src="/brand/simbolo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" priority />
          <span className="hidden font-display text-lg font-semibold tracking-tight text-marinho sm:inline">
            Sonhos no Papel
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          <Suspense
            fallback={NAV.map((item) => (
              <Link key={item.href} href={item.href} className={`${linkBase} text-marinho-texto hover:bg-bebe-soft`}>
                {item.label}
              </Link>
            ))}
          >
            <NavLinks />
          </Suspense>
        </nav>

        <form action="/produtos" method="get" role="search" className="ml-auto flex min-w-0 flex-1 justify-end">
          <label htmlFor="busca-topo" className="sr-only">
            Buscar produtos
          </label>
          <input
            id="busca-topo"
            name="q"
            type="search"
            placeholder="Buscar produtos"
            className="w-full max-w-xs rounded-full border border-borda bg-white px-4 py-2 text-sm text-marinho placeholder:text-muted focus:border-rosa focus:outline-none"
          />
        </form>

        <Link
          href="/carrinho"
          className="relative flex h-10 shrink-0 items-center gap-2 rounded-full bg-marinho px-4 text-sm font-semibold text-papel shadow-suave transition-colors hover:bg-marinho-texto"
          aria-label={`Carrinho, ${count} ${count === 1 ? "item" : "itens"}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
            <path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6" />
          </svg>
          <span className="hidden sm:inline">Carrinho</span>
          <span
            aria-hidden="true"
            className="min-w-5 rounded-full bg-rosa px-1.5 text-center text-xs font-bold leading-5 text-marinho"
          >
            {count}
          </span>
        </Link>
      </div>
    </header>
  );
}
