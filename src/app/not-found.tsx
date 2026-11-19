import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bebe-soft px-4 text-center">
      <Image src="/brand/logo-completa.webp" alt="Sonhos no Papel" width={160} height={188} className="h-auto w-32" priority />
      <h1 className="font-display text-3xl font-semibold text-marinho">Essa página saiu do papel</h1>
      <p className="max-w-md text-muted">O endereço pode ter mudado ou o produto não está mais disponível. Que tal voltar ao catálogo?</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/produtos" className="rounded-full bg-marinho px-6 py-3 text-sm font-bold text-papel shadow-suave hover:bg-marinho-texto">
          Ver catálogo
        </Link>
        <Link href="/" className="rounded-full border border-marinho px-6 py-3 text-sm font-bold text-marinho hover:bg-white">
          Página inicial
        </Link>
      </div>
    </main>
  );
}
