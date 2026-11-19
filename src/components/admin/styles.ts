/**
 * Classes compartilhadas do painel. Módulo SEM "use client": pode ser usado tanto em
 * Server Components quanto em Client Components.
 */
export const inputClass =
  "w-full rounded-md border border-borda bg-white px-3 py-2 text-sm text-marinho placeholder:text-muted focus:border-rosa focus:outline-none";
export const labelClass = "mb-1 block text-xs font-bold uppercase tracking-wide text-muted";
export const cardClass = "rounded-md border border-borda bg-white p-5 shadow-suave";

export type ButtonVariant = "primary" | "secondary" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-marinho text-papel hover:bg-marinho-texto",
  secondary: "border border-marinho text-marinho hover:bg-lilas-soft",
  danger: "border border-rosa bg-rosa-soft text-marinho hover:bg-rosa",
};

export function buttonClass(variant: ButtonVariant = "primary", small = false) {
  return `inline-flex items-center justify-center rounded-full font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    small ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"
  } ${variants[variant]}`;
}
