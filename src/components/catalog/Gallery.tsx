"use client";

import { animate } from "animejs";
import { useEffect, useRef, useState } from "react";
import { TiltCard } from "@/components/site/TiltCard";
import { ProductImage } from "./ProductCard";

/**
 * Galeria do produto: a foto principal gira em 3D ao trocar de miniatura
 * (revelação animada) e se inclina com o mouse. Sem animação com "reduzir movimento".
 */
export function Gallery({ images, name }: { images: { url: string; alt: string | null }[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? null;
  const frameRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!frameRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animate(frameRef.current, { rotateY: [-70, 0], opacity: [0.2, 1], scale: [0.94, 1], duration: 700, ease: "outCubic" });
  }, [index]);

  return (
    <div className="space-y-3" style={{ perspective: "1100px" }}>
      <TiltCard className="rounded-md" max={5}>
        <div ref={frameRef} className="overflow-hidden rounded-md border border-borda bg-white">
          <ProductImage url={current?.url ?? null} alt={current?.alt ?? name} className="aspect-square h-full w-full" />
        </div>
      </TiltCard>
      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2" aria-label="Fotos do produto">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${images.length}`}
                aria-current={i === index}
                className={`block w-full overflow-hidden rounded-sm border-2 transition-colors duration-300 ease-out ${i === index ? "border-accent-600" : "border-borda hover:border-lilas"}`}
              >
                <ProductImage url={img.url} alt={img.alt ?? name} className="aspect-square h-full w-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
