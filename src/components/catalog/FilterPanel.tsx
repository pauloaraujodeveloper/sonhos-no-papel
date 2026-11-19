"use client";

import { useState } from "react";

/** No celular os filtros ficam recolhidos atrás de um botão; no desktop aparecem sempre. */
export function FilterPanel({ children, active }: { children: React.ReactNode; active: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:self-start">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-full border border-borda bg-white px-5 py-3 text-sm font-bold text-marinho shadow-suave lg:hidden"
      >
        <span>Filtrar e ordenar{active ? " · ativos" : ""}</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div className={`${open ? "mt-3 block" : "hidden"} lg:mt-0 lg:block`}>{children}</div>
    </div>
  );
}
