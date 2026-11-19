"use client";

import { RiMenuLine, RiCloseLine, RiSearchLine, RiShoppingBagLine } from "@remixicon/react";
import { animate } from "animejs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useCartCount } from "@/lib/cart/store";

export type NavCategory = { name: string; slug: string };

const linkBase = "whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-300 ease-out";

/** Links com destaque da página atual. Usa o pathname, que só existe em tempo de requisição. */
function NavLinks({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Início", active: pathname === "/", extra: false },
    { href: "/produtos", label: "Catálogo", active: pathname.startsWith("/produtos"), extra: false },
    // Em telas médias cabem só 3 categorias; as demais aparecem de 1280px em diante.
    ...categories.slice(0, 5).map((c, i) => ({ href: `/categoria/${c.slug}`, label: c.name, active: pathname === `/categoria/${c.slug}`, extra: i >= 3 })),
  ];
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`${linkBase} ${item.extra ? "hidden xl:inline-block" : ""} ${item.active ? "bg-lilas-soft text-marinho" : "text-marinho-texto hover:bg-bebe-soft"}`}
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
    <header className="sticky top-0 z-30 border-b border-borda bg-papel/85 backdrop-blur-md">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-marinho focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-papel">
        Ir para o conteúdo
      </a>
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:gap-6">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-borda bg-white text-marinho transition-colors duration-300 ease-out hover:bg-lilas-soft lg:hidden"
        >
          {menuOpen ? <RiCloseLine aria-hidden="true" className="h-5 w-5" /> : <RiMenuLine aria-hidden="true" className="h-5 w-5" />}
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Sonhos no Papel — página inicial" onClick={() => setMenuOpen(false)}>
          <Image src="/brand/simbolo.png" alt="" width={44} height={44} className="h-11 w-11 object-contain sm:hidden" priority />
          <Image src="/brand/logo-horizontal.webp" alt="Sonhos no Papel" width={200} height={74} className="hidden h-11 w-auto sm:block" priority />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:ml-2 lg:flex">
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
          <div className="relative w-full lg:max-w-sm">
            <RiSearchLine aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="busca-topo"
              name="q"
              type="search"
              placeholder="Buscar"
              className="h-11 w-full rounded-full border border-borda bg-white pl-10 pr-4 text-sm text-marinho shadow-suave transition-colors duration-300 ease-out placeholder:text-muted focus:border-rosa focus:outline-none"
            />
          </div>
        </form>

        <Link
          href="/carrinho"
          className="relative flex h-11 shrink-0 items-center gap-2 rounded-full bg-marinho px-4 text-sm font-semibold text-papel shadow-suave transition-colors duration-300 ease-out hover:bg-marinho-texto"
          aria-label={`Carrinho, ${count} ${count === 1 ? "item" : "itens"}`}
        >
          <RiShoppingBagLine aria-hidden="true" className="h-5 w-5" />
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
                <Link href={item.href} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center rounded-md px-3 text-base font-semibold text-marinho transition-colors duration-300 ease-out hover:bg-lilas-soft">
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
