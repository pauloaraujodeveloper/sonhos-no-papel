import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/catalog/ProductCard";
import { listCategories, listProducts, type ProductListParams } from "@/lib/catalog/queries";
import { buildWhatsAppUrl } from "@/lib/commerce/whatsapp";
import { db } from "@/lib/db";

/** Botão de WhatsApp com o número cadastrado no painel (Configurações). Some se não houver número. */
async function WhatsAppButton() {
  const settings = await db.storeSettings.findUnique({ where: { id: "default" }, select: { whatsappNumber: true } });
  if (!settings?.whatsappNumber) return null;
  return (
    <a
      href={buildWhatsAppUrl(settings.whatsappNumber, "Olá! Gostaria de conhecer os produtos da Sonhos no Papel.")}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border border-marinho px-6 py-3 text-sm font-bold text-marinho transition-colors hover:bg-white"
    >
      Falar no WhatsApp
    </a>
  );
}

async function Categories() {
  const categories = await listCategories();
  if (categories.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={`/categoria/${c.slug}`}
            className="inline-block rounded-full border border-borda bg-white px-5 py-2 text-sm font-semibold text-marinho shadow-suave transition-colors hover:bg-lilas-soft"
          >
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Seção de produtos da home. Some quando não há nenhum produto para exibir. */
async function ProductSection({ title, params, href }: { title: string; params: ProductListParams; href: string }) {
  const { items } = await listProducts({ ...params, limit: 4 });
  if (items.length === 0) return null;
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-marinho">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-marinho-texto hover:underline">
          Ver todos
        </Link>
      </div>
      <ProductGrid products={items} />
    </section>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6">
      <section className="grid items-center gap-8 rounded-lg bg-bebe-soft p-6 sm:p-10 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-marinho sm:text-5xl">
            Um cantinho de criatividade para o seu papel.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Canetas, lápis, agendas, cadernos e pincéis escolhidos com delicadeza. Monte seu carrinho e finalize o pedido
            pelo WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/produtos"
              className="rounded-full bg-marinho px-6 py-3 text-sm font-bold text-papel shadow-suave transition-colors hover:bg-marinho-texto"
            >
              Ver produtos
            </Link>
            <Suspense fallback={null}>
              <WhatsAppButton />
            </Suspense>
          </div>
        </div>
        <Image
          src="/brand/logo-completa.webp"
          alt="Logo Sonhos no Papel: nuvem azul, lilás, lápis e clipe"
          width={240}
          height={280}
          priority
          className="mx-auto h-auto w-48 md:w-60"
        />
      </section>

      <section className="mt-10" aria-labelledby="categorias">
        <h2 id="categorias" className="mb-3 font-display text-2xl font-semibold tracking-tight text-marinho">
          Categorias
        </h2>
        <Suspense fallback={<div className="h-10 w-2/3 animate-pulse rounded-full bg-lilas-soft" aria-hidden="true" />}>
          <Categories />
        </Suspense>
      </section>

      <Suspense fallback={<ProductGridSkeleton count={4} />}>
        <ProductSection title="Em destaque" params={{ onlyFeatured: true }} href="/produtos" />
      </Suspense>
      <Suspense fallback={null}>
        <ProductSection title="Novidades" params={{ onlyNew: true }} href="/produtos?ordem=novidades" />
      </Suspense>
      <Suspense fallback={null}>
        <ProductSection title="Ofertas especiais" params={{ onlyPromo: true }} href="/produtos" />
      </Suspense>
    </main>
  );
}
