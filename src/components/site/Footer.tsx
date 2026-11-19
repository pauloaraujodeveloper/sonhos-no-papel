import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-borda bg-bebe-soft">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-base font-semibold text-marinho">Sonhos no Papel</p>
          <p>Papelaria com carinho. Pedidos finalizados pelo WhatsApp.</p>
        </div>
        <nav aria-label="Rodapé" className="flex gap-4 font-semibold text-marinho-texto">
          <Link href="/produtos" className="hover:underline">
            Produtos
          </Link>
          <Link href="/carrinho" className="hover:underline">
            Carrinho
          </Link>
        </nav>
      </div>
    </footer>
  );
}
