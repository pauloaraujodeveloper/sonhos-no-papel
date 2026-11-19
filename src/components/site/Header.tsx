"use client";

import { animate } from "animejs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useCartCount } from "@/lib/cart/store";

export type NavCategory = { name: string; slug: string };

const linkBase = "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors";

/** Links com destaque da página atual. Usa o pathname, que só existe em tempo de requisição. */
function NavLinks({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Início", active: pathname === "/" },
    { href: "/produtos", label: "Catálogo", active: pathname.startsWith("/produtos") },
    ...categories.slice(0, 5).map((c) => ({ href: `/categoria/${c.slug}`, label: c.name, active: pathname === `/categoria/${c.slug}` })),
  ];
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`${linkBase} ${item.active ? "bg-lilas-soft text-marinho" : "text-marinho-texto hover:bg-bebe-soft"}`}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export function Header({ categories = [] }: { categories?: NavCategory[] }) {
  const count = useCartCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const previous = useRef(count);

  // Animação discreta no contador quando um item entra no carrinho.
  useEffect(() => {
    if (count > previous.current && badgeRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animate(badgeRef.current, { scale: [1, 1.45, 1], duration: 450, ease: "outQuad" });
    }
    previous.current = count;
  }, [count]);

  const fallback = [
    { href: "/", label: "Início" },
    { href: "/produtos", label: "Catálogo" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-borda bg-papel/90 backdrop-blur">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-marinho focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-papel">
        Ir para o conteúdo
      </a>
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-borda bg-white text-marinho lg:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Sonhos no Papel — página inicial" onClick={() => setMenuOpen(false)}>
          <Image src="/brand/simbolo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain sm:hidden" priority />
          <Image src="/brand/logo-horizontal.webp" alt="Sonhos no Papel" width={200} height={74} className="hidden h-11 w-auto sm:block" priority />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          <Suspense
            fallback={fallback.map((item) => (
              <Link key={item.href} href={item.href} className={`${linkBase} text-marinho-texto hover:bg-bebe-soft`}>
                {item.label}
              </Link>
            ))}
          >
            <NavLinks categories={categories} />
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
          <span ref={badgeRef} aria-hidden="true" className="min-w-5 rounded-full bg-rosa px-1.5 text-center text-xs font-bold leading-5 text-marinho">
            {count}
          </span>
        </Link>
      </div>

      {menuOpen && (
        <nav id="menu-mobile" aria-label="Menu" className="border-t border-borda bg-papel lg:hidden">
          <ul className="mx-auto grid max-w-6xl gap-1 px-4 py-3 sm:px-6">
            {[{ href: "/", label: "Início" }, { href: "/produtos", label: "Catálogo completo" }, ...categories.map((c) => ({ href: `/categoria/${c.slug}`, label: c.name }))].map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setMenuOpen(false)} className="block rounded-md px-3 py-2.5 text-base font-semibold text-marinho hover:bg-lilas-soft">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
