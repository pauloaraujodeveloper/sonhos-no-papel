"use client";

import { useRef } from "react";

/**
 * Inclinação 3D que acompanha o mouse, com um brilho suave por cima.
 * Só atua com mouse (hover fino) e sem "reduzir movimento"; no celular o cartão fica parado.
 */
export function TiltCard({ children, className = "", max = 7 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function canTilt() {
    return window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;
  }

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !canTilt()) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    el.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(0)}%`);
    el.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(0)}%`);
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`tilt ${className}`}>
      {children}
      <span className="tilt-glare" aria-hidden="true" />
    </div>
  );
}
