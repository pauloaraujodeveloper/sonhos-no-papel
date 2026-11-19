"use client";

import { useState } from "react";
import { ProductImage } from "./ProductCard";

/** Galeria do produto: a foto principal muda ao tocar nas miniaturas. */
export function Gallery({ images, name }: { images: { url: string; alt: string | null }[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border border-borda bg-white">
        <ProductImage url={current?.url ?? null} alt={current?.alt ?? name} className="aspect-square h-full w-full" />
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2" aria-label="Fotos do produto">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${images.length}`}
                aria-current={i === index}
                className={`block w-full overflow-hidden rounded-sm border-2 transition-colors ${i === index ? "border-accent-600" : "border-borda hover:border-lilas"}`}
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
