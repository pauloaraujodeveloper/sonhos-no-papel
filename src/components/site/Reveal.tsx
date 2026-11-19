"use client";

import { animate, stagger } from "animejs";
import { useEffect, useRef } from "react";

/**
 * Anima os filhos diretos com entrada suave (fade + subida) quando o grupo aparece na tela.
 * O estado inicial (opacidade 0) vem do CSS (.reveal em brand.css), então não há "pisca" na hidratação.
 * Sem JavaScript ou com "reduzir movimento", o CSS mostra tudo normalmente.
 */
export function RevealGroup({
  children,
  className = "",
  step = 70,
}: {
  children: React.ReactNode;
  className?: string;
  /** Intervalo entre um filho e o próximo, em ms. */
  step?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      items.forEach((i) => (i.style.opacity = "1"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        animate(items, {
          opacity: [0, 1],
          translateY: [18, 0],
          duration: 650,
          delay: stagger(step),
          ease: "outQuad",
        });
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [step]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
