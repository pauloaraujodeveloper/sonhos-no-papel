"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";

export type RevealDirection = "left" | "right" | "up" | "down" | "flip";

/** De onde cada item "chega": deslocamento em px e giro em graus (efeito 3D com perspectiva no grupo). */
const FROM: Record<RevealDirection, { x: number; y: number; ry: number; rx: number }> = {
  left: { x: -56, y: 0, ry: -18, rx: 0 },
  right: { x: 56, y: 0, ry: 18, rx: 0 },
  up: { x: 0, y: 44, ry: 0, rx: 14 },
  down: { x: 0, y: -44, ry: 0, rx: -14 },
  flip: { x: 0, y: 24, ry: -55, rx: 0 },
};

/**
 * Revela os filhos diretos quando o grupo aparece na tela, cada um vindo de uma direção
 * (esquerda, direita, de baixo, de cima ou girando em 3D), em ciclo pela lista `directions`.
 * O estado inicial (opacidade 0) vem do CSS (.reveal em brand.css), então não há "pisca" na hidratação.
 * Sem JavaScript ou com "reduzir movimento", o conteúdo aparece direto, sem animação.
 */
export function RevealGroup({
  children,
  className = "",
  step = 80,
  directions = ["up"],
}: {
  children: React.ReactNode;
  className?: string;
  /** Intervalo entre um filho e o próximo, em ms. */
  step?: number;
  directions?: RevealDirection[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const directionsKey = directions.join(",");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      items.forEach((i) => (i.style.opacity = "1"));
      return;
    }
    const list = directionsKey.split(",") as RevealDirection[];

    // Se o JavaScript demorou e o CSS já mostrou tudo (fallback), não anima: evita sumir e reaparecer.
    if (items.length > 0 && getComputedStyle(items[0]).opacity === "1") return;
    // A partir daqui o grupo é controlado pela animação: desliga o fallback do CSS.
    el.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        items.forEach((item, index) => {
          const from = FROM[list[index % list.length]];
          animate(item, {
            opacity: [0, 1],
            translateX: [from.x, 0],
            translateY: [from.y, 0],
            rotateY: [from.ry, 0],
            rotateX: [from.rx, 0],
            duration: 850,
            delay: index * step,
            ease: "outCubic",
          });
        });
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [step, directionsKey]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
