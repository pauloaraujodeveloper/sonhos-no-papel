import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Carousel, CarouselItem } from "@/components/base/carousel/carousel";
import { ButtonLink } from "@/components/base/buttons/button";
import { ProductCard, ProductGridSkeleton } from "@/components/catalog/ProductCard";
import { RevealGroup } from "@/components/site/Reveal";
import { SocialLinks } from "@/components/site/SocialLinks";
import { Slogan } from "@/components/site/ThemeStyle";
import { listCategories, listProducts, type ProductListParams } from "@/lib/catalog/queries";
import { BRAND } from "@/lib/brand";
import { buildWhatsAppUrl } from "@/lib/commerce/whatsapp";
import { db } from "@/lib/db";

/** Faixa de aviso do painel (Banners): primeiro banner ativo. Não aparece sem banner. */
async function Announcement() {
  const banner = await db.banner.findFirst({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  if (!banner) return null;
  const link = banner.linkUrl ?? "";
  const external = link.startsWith("https://");
  const ctaClass =
    "inline-block rounded-full bg-marinho px-5 py-2.5 text-sm font-bold text-papel shadow-suave transition-colors hover:bg-marinho-texto";

  // Com imagem: faixa grande com a foto ao fundo e um véu claro à esquerda para o texto ficar legível.
  if (banner.imageUrl) {
    return (
      <section aria-label={banner.title} className="relative mb-8 overflow-hidden rounded-lg bg-bebe-soft">
        {/* Imagem vinda do armazenamento externo (Vercel Blob ou link https cadastrado no painel). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/0" aria-hidden="true" />
        <div className="relative flex min-h-52 max-w-xl flex-col justify-center gap-2 p-6 sm:min-h-64 sm:p-10">
          <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight text-marinho sm:text-4xl">{banner.title}</h2>
          {banner.subtitle && <p className="text-marinho-texto sm:text-lg">{banner.subtitle}</p>}
          {link && (
            <div className="pt-2">
              {external ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className={ctaClass}>
                  Saiba mais
                </a>
              ) : (
                <Link href={link} className={ctaClass}>
                  Ver agora
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md bg-lilas-soft px-5 py-3">
      <div>
        <p className="font-display font-semibold text-marinho">{banner.title}</p>
        {banner.subtitle && <p className="text-sm text-muted">{banner.subtitle}</p>}
      </div>
      {link &&
        (external ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-accent-600 hover:underline">
            Saiba mais →
          </a>
        ) : (
          <Link href={link} className="text-sm font-bold text-accent-600 hover:underline">
            Ver agora →
          </Link>
        ))}
    </div>
  );
}

/**
 * Vitrine principal. Mostra os produtos em destaque e, enquanto nenhum estiver marcado
 * no painel, os mais recentes, para a página nunca ficar vazia.
 */
async function Showcase() {
  const featured = await listProducts({ onlyFeatured: true, limit: 7 });
  const items = featured.items.length > 0 ? featured.items : (await listProducts({ limit: 7 })).items;
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-borda bg-white p-12 text-center">
        <p className="font-display text-xl font-semibold text-marinho">O catálogo está sendo preparado</p>
        <p className="mt-1 text-sm text-muted">Em breve os produtos estarão aqui.</p>
      </div>
    );
  }
  const [lead, ...others] = items;
  // Mantém a grade completa: com quantidade ímpar, o último card sai (sem buracos na vitrine).
  const rest = others.length % 2 === 1 ? others.slice(0, -1) : others;
  return (
    <RevealGroup className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 ${rest.length >= 4 ? "lg:grid-rows-2" : ""}`}>
      <div className={`col-span-2 ${rest.length >= 4 ? "lg:row-span-2" : ""}`}>
        <ProductCard product={lead} featured />
      </div>
      {rest.map((p) => (
        <div key={p.id}>
          <ProductCard product={p} />
        </div>
      ))}
    </RevealGroup>
  );
}

async function Categories() {
  const categories = await listCategories();
  if (categories.length === 0) return null;
  return (
    <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/categoria/${c.slug}`}
          className="group flex flex-col justify-between gap-6 rounded-md border border-borda bg-white p-4 shadow-suave transition duration-300 hover:-translate-y-1 hover:bg-lilas-soft"
        >
          <span className="font-display text-lg font-semibold text-marinho">{c.name}</span>
          <span className="text-xs font-bold text-accent-600 group-hover:underline">Explorar →</span>
        </Link>
      ))}
    </RevealGroup>
  );
}

/** Faixa deslizante (carrossel) de produtos. Some quando não há produtos. */
async function Strip({ title, params, href }: { title: string; params: ProductListParams; href: string }) {
  const { items } = await listProducts({ ...params, limit: 10 });
  if (items.length === 0) return null;
  return (
    <section className="mt-14" aria-label={title}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-marinho">{title}</h2>
        <Link href={href} className="text-sm font-bold text-accent-600 hover:underline">
          Ver todos
        </Link>
      </div>
      <Carousel aria-label={title} showDots={false} gap={12}>
        {items.map((p) => (
          <CarouselItem key={p.id} className="w-[62%] sm:w-[34%] lg:w-[23%]">
            <ProductCard product={p} />
          </CarouselItem>
        ))}
      </Carousel>
    </section>
  );
}

async function WhatsAppCta() {
  const settings = await db.storeSettings.findUnique({ where: { id: "default" }, select: { whatsappNumber: true } });
  if (!settings?.whatsappNumber) return null;
  return (
    <ButtonLink
      href={buildWhatsAppUrl(settings.whatsappNumber, "Olá! Gostaria de conhecer os produtos da Sonhos no Papel.")}
      target="_blank"
      rel="noopener noreferrer"
      variant="secondary"
    >
      Falar no WhatsApp
    </ButtonLink>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6">
      <Suspense fallback={null}>
        <Announcement />
      </Suspense>

      <div className="mb-3 flex items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-marinho sm:text-4xl">Em destaque</h1>
        <Link href="/produtos" className="text-sm font-bold text-accent-600 hover:underline">
          Ver catálogo completo →
        </Link>
      </div>

      <Suspense fallback={<ProductGridSkeleton count={5} />}>
        <Showcase />
      </Suspense>

      <section className="mt-14" aria-labelledby="categorias">
        <h2 id="categorias" className="mb-4 font-display text-2xl font-semibold tracking-tight text-marinho">
          Explore por categoria
        </h2>
        <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-lilas-soft" aria-hidden="true" />}>
          <Categories />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <Strip title="Novidades" params={{ onlyNew: true }} href="/produtos?ordem=novidades" />
      </Suspense>
      <Suspense fallback={null}>
        <Strip title="Ofertas especiais" params={{ onlyPromo: true }} href="/produtos" />
      </Suspense>

      <section className="mt-16" aria-labelledby="como-comprar">
        <h2 id="como-comprar" className="mb-4 font-display text-2xl font-semibold tracking-tight text-marinho">
          Como comprar
        </h2>
        <RevealGroup className="grid gap-3 sm:grid-cols-3">
          {[
            { n: "1", title: "Escolha", text: "Navegue pelo catálogo e coloque no carrinho o que gostou." },
            { n: "2", title: "Envie o pedido", text: "Informe seus dados e finalize pelo WhatsApp com o pedido já montado." },
            { n: "3", title: "Receba o Pix", text: "Pelo WhatsApp você recebe a chave ou o QR Code Pix para pagar." },
          ].map((s) => (
            <div key={s.n} className="rounded-md border border-borda bg-white p-5 shadow-suave">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rosa-soft text-sm font-bold text-marinho">{s.n}</span>
              <p className="mt-3 font-display text-lg font-semibold text-marinho">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </RevealGroup>
      </section>

      <section className="relative mt-12 flex flex-col items-center gap-4 overflow-hidden rounded-lg bg-bebe-soft px-6 py-10 text-center">
        {/* Marca d'água discreta com o símbolo da marca. */}
        <Image src="/brand/simbolo.png" alt="" width={320} height={256} aria-hidden="true" className="pointer-events-none absolute -left-10 -top-6 hidden h-auto w-56 -rotate-12 opacity-30 sm:block" />
        <Image src="/brand/simbolo.png" alt="" width={320} height={256} aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-10 hidden h-auto w-64 rotate-12 opacity-30 sm:block" />
        <Image src="/brand/logo-completa.webp" alt="Sonhos no Papel" width={140} height={164} className="relative h-auto w-28" />
        <p className="max-w-md font-display text-xl font-semibold text-marinho">
          <Suspense fallback={BRAND.slogan}>
            <Slogan />
          </Suspense>
          .
        </p>
        <p className="max-w-md text-muted">Ficou com dúvida sobre algum produto? Chame a gente no WhatsApp.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href="/produtos">Ver catálogo</ButtonLink>
          <Suspense fallback={null}>
            <WhatsAppCta />
          </Suspense>
        </div>
        <div className="flex justify-center">
          <Suspense fallback={null}>
            <SocialLinks />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
