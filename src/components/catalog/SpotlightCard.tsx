"use client";

import type { ReactNode } from "react";
import { useRef } from "react";

/**
 * Cartão de produto com um brilho que acompanha o cursor (só com mouse; o efeito é CSS em brand.css).
 * Guarda a posição do ponteiro em variáveis CSS, sem re-renderizar nada.
 */
export function SpotlightCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <article ref={ref} onPointerMove={onPointerMove} className={`spotlight ${className}`}>
      {children}
    </article>
  );
}
