import type { Metadata } from "next";
import { CheckoutView } from "@/components/cart/CheckoutView";

export const metadata: Metadata = { title: "Finalizar pedido" };

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-marinho">Finalizar pedido</h1>
      <CheckoutView />
    </main>
  );
}
