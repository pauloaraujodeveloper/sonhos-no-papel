import {
  RiArrowRightLine,
  RiBook2Line,
  RiBrushLine,
  RiCalendar2Line,
  RiCheckboxCircleLine,
  RiPencilLine,
  RiPenNibLine,
  RiQrCodeLine,
  RiSearchLine,
  RiShoppingBag3Line,
  RiWhatsappLine,
} from "@remixicon/react";
import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Carousel, CarouselItem } from "@/components/base/carousel/carousel";
import { ButtonLink } from "@/components/base/buttons/button";
import { ProductCard, ProductGridSkeleton } from "@/components/catalog/ProductCard";
import { RevealGroup } from "@/components/site/Reveal";
import { TiltCard } from "@/components/site/TiltCard";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { SocialLinks } from "@/components/site/SocialLinks";
import { Slogan } from "@/components/site/ThemeStyle";
import { listCategories, listProducts, type ProductListParams } from "@/lib/catalog/queries";
import { BRAND } from "@/lib/brand";
import { buildWhatsAppUrl } from "@/lib/commerce/whatsapp";
import { db } from "@/lib/db";

/** Espaço vertical entre as seções da home. */
const SECTION = "mt-16 sm:mt-24";

/** Link de "ver mais" com seta em ícone; a seta nunca quebra sozinha para a linha de baixo. */
function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex min-h-11 items-center gap-1 whitespace-nowrap text-sm font-bold text-accent-600 transition-colors duration-300 ease-out hover:text-marinho">
      <span>{children}</span>
      <RiArrowRightLine aria-hidden="true" className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Rótulo pequeno em maiúsculas acima dos títulos de seção. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-accent-600">
      <span aria-hidden="true" className="h-px w-6 bg-current" />
      {children}
    </p>
  );
}

/** Destaca a última palavra do título com a cor de acento. */
function AccentTitle({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <>{text}</>;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <span className="text-accent-600">{last}</span>
    </>
  );
}

/** Topo da home: primeiro banner ativo do painel (imagem, título, texto e link). Sem banner, não aparece. */
async function Announcement() {
  const banner = await db.banner.findFirst({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  if (!banner) return null;
  const link = banner.linkUrl ?? "";
  const external = link.startsWith("https://");
  const extraLink = link && link !== "/produtos";

  if (banner.imageUrl) {
    return (
      <section aria-label={banner.title} className="relative mb-12 overflow-hidden rounded-lg bg-bebe-soft sm:mb-16">
        {/* Imagem vinda do armazenamento externo (Vercel Blob ou link https cadastrado no painel). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Véu: mais forte no celular (texto por cima da foto) e lateral no computador. */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-white/40 sm:bg-gradient-to-r sm:from-white/90 sm:via-white/55 sm:to-white/0" aria-hidden="true" />
        <div className="relative flex min-h-80 items-center p-4 sm:min-h-[26rem] sm:p-10 lg:min-h-[30rem]">
          <TiltCard max={3} className="max-w-xl rounded-lg">
          <div className="rounded-lg bg-white/60 p-5 shadow-suave backdrop-blur-md sm:p-8">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-marinho sm:text-5xl lg:text-6xl">
              <AccentTitle text={banner.title} />
            </h2>
            {banner.subtitle && <p className="mt-3 text-base text-marinho-texto sm:text-lg">{banner.subtitle}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ButtonLink href="/produtos" className="min-h-11">
                Ver catálogo
              </ButtonLink>
              {extraLink &&
                (external ? (
                  <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-bold text-accent-600 hover:underline">
                    Saiba mais
                  </a>
                ) : (
                  <Link href={link} className="inline-flex min-h-11 items-center text-sm font-bold text-accent-600 hover:underline">
                    Ver agora
                  </Link>
                ))}
            </div>
          </div>
          </TiltCard>
        </div>
      </section>
    );
  }

  return (
    <div className="mb-12 flex flex-wrap items-center justify-between gap-3 rounded-md bg-gradient-to-r from-lilas-soft to-bebe-soft px-5 py-4 sm:mb-16">
      <div>
        <p className="font-display font-semibold text-marinho">{banner.title}</p>
        {banner.subtitle && <p className="text-sm text-muted">{banner.subtitle}</p>}
      </div>
      {link &&
        (external ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-bold text-accent-600 hover:underline">
            Saiba mais
          </a>
        ) : (
          <MoreLink href={link}>Ver agora</MoreLink>
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
        <Image src="/brand/simbolo.png" alt="" width={96} height={77} className="mx-auto mb-3 h-auto w-24" />
        <p className="font-display text-xl font-semibold text-marinho">O catálogo está sendo preparado</p>
        <p className="mt-1 text-sm text-muted">Em breve os produtos estarão aqui.</p>
      </div>
    );
  }
  const [lead, ...others] = items;
  // Mantém a grade completa: com quantidade ímpar, o último card sai (sem buracos na vitrine).
  const rest = others.length % 2 === 1 ? others.slice(0, -1) : others;
  return (
    <RevealGroup
      directions={["left", "up", "right", "down", "flip"]}
      className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 ${rest.length >= 4 ? "lg:grid-rows-2" : ""}`}
    >
      <div className={`col-span-2 ${rest.length >= 4 ? "lg:row-span-2" : ""}`}>
        <ProductCard product={lead} featured />
      </div>
      {rest.map((p, i) => (
        // Zigue-zague no computador: os cartões pares descem um pouco, quebrando a linha reta da grade.
        <div key={p.id} className={i % 2 === 1 ? "lg:mt-8" : ""}>
          <ProductCard product={p} />
        </div>
      ))}
    </RevealGroup>
  );
}

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

/** Escolhe o ícone pelo nome/slug da categoria; categorias novas usam o ícone genérico. */
function categoryIcon(slug: string, name: string): Icon {
  const key = `${slug} ${name}`.toLowerCase();
  if (/caneta/.test(key)) return RiPenNibLine;
  if (/l[aá]pis|lapis/.test(key)) return RiPencilLine;
  if (/agenda|planner/.test(key)) return RiCalendar2Line;
  if (/caderno|bloco|livro/.test(key)) return RiBook2Line;
  if (/pinc[eé]l|pincel|tinta/.test(key)) return RiBrushLine;
  return RiShoppingBag3Line;
}

// Fundos suaves da paleta, em rodízio (tokens do tema, editáveis em Aparência).
const CATEGORY_TONES = ["bg-lilas-soft", "bg-rosa-soft", "bg-bebe-soft", "bg-sol/30", "bg-lilas-soft"];

async function Categories() {
  const categories = await listCategories();
  if (categories.length === 0) return null;
  // Com 5 categorias, a primeira vira um cartão grande (grade "bento") no computador.
  const bento = categories.length === 5;
  return (
    <RevealGroup directions={["flip", "down", "left", "right", "up"]} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${bento ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
      {categories.map((c, i) => {
        const IconComponent = categoryIcon(c.slug, c.name);
        const isLast = i === categories.length - 1;
        const span = bento && i === 0 ? "col-span-2 lg:row-span-2" : !bento && isLast && categories.length % 2 === 1 ? "col-span-2 sm:col-span-1" : "";
        return (
          <Link
            key={c.id}
            href={`/categoria/${c.slug}`}
            className={`group flex min-h-36 flex-col justify-between gap-6 rounded-md border border-borda p-4 shadow-suave transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ${CATEGORY_TONES[i % CATEGORY_TONES.length]} ${span}`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-marinho transition-transform duration-300 ease-out group-hover:scale-110">
              <IconComponent aria-hidden="true" className="h-6 w-6" />
            </span>
            <span className="flex items-end justify-between gap-2">
              <span className="font-display text-lg font-semibold leading-tight text-marinho">{c.name}</span>
              <RiArrowRightLine aria-hidden="true" className="h-4 w-4 shrink-0 text-accent-600 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </span>
          </Link>
        );
      })}
    </RevealGroup>
  );
}

/** Faixa deslizante (carrossel) de produtos. Some quando não há produtos. */
async function Strip({ title, eyebrow, params, href }: { title: string; eyebrow: string; params: ProductListParams; href: string }) {
  const { items } = await listProducts({ ...params, limit: 10 });
  if (items.length === 0) return null;
  return (
    <section className={SECTION} aria-label={title}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-marinho">{title}</h2>
        </div>
        <MoreLink href={href}>Ver todos</MoreLink>
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
      className="min-h-11"
    >
      Falar no WhatsApp
    </ButtonLink>
  );
}

const STEPS: { n: string; title: string; text: string; icon: Icon }[] = [
  { n: "1", title: "Escolha", text: "Navegue pelo catálogo e coloque no carrinho o que gostou.", icon: RiSearchLine },
  { n: "2", title: "Envie o pedido", text: "Informe seus dados e finalize pelo WhatsApp com o pedido já montado.", icon: RiWhatsappLine },
  { n: "3", title: "Receba o Pix", text: "Pelo WhatsApp você recebe a chave ou o QR Code Pix para pagar.", icon: RiQrCodeLine },
];

/** Três garantias curtas logo após a vitrine: atendimento, Pix e estoque. */
const BENEFITS: { title: string; text: string; icon: Icon }[] = [
  { title: "Atendimento direto", text: "Tire dúvidas e feche seu pedido pelo WhatsApp.", icon: RiWhatsappLine },
  { title: "Pagamento por Pix", text: "Você recebe a chave ou o QR Code Pix na conversa.", icon: RiQrCodeLine },
  { title: "Estoque atualizado", text: "Cada produto mostra a disponibilidade do momento.", icon: RiCheckboxCircleLine },
];

function Benefits() {
  return (
    <RevealGroup directions={["left", "up", "right"]} className="mt-12 grid gap-3 sm:mt-16 sm:grid-cols-3">
      {BENEFITS.map((b) => (
        <div key={b.title} className="flex items-start gap-3 rounded-md border border-borda bg-white/70 p-4 backdrop-blur-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lilas-soft text-marinho">
            <b.icon aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display font-semibold text-marinho">{b.title}</p>
            <p className="text-sm text-muted">{b.text}</p>
          </div>
        </div>
      ))}
    </RevealGroup>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6">
      <ScrollProgress />
      <h1 className="sr-only">Sonhos no Papel, papelaria afetiva</h1>

      <Suspense fallback={null}>
        <Announcement />
      </Suspense>

      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Vitrine</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-marinho sm:text-4xl">Em destaque</h2>
        </div>
        <MoreLink href="/produtos">
          Ver catálogo<span className="hidden sm:inline"> completo</span>
        </MoreLink>
      </div>

      <Suspense fallback={<ProductGridSkeleton count={5} />}>
        <Showcase />
      </Suspense>

      <Benefits />

      <section className={SECTION} aria-labelledby="categorias">
        <Eyebrow>Navegue</Eyebrow>
        <h2 id="categorias" className="mb-4 font-display text-2xl font-semibold tracking-tight text-marinho">
          Explore por categoria
        </h2>
        <Suspense fallback={<div className="h-36 animate-pulse rounded-md bg-lilas-soft" aria-hidden="true" />}>
          <Categories />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <Strip title="Novidades" eyebrow="Chegou agora" params={{ onlyNew: true }} href="/produtos?ordem=novidades" />
      </Suspense>
      <Suspense fallback={null}>
        <Strip title="Ofertas especiais" eyebrow="Oportunidades" params={{ onlyPromo: true }} href="/produtos" />
      </Suspense>

      <section className={SECTION} aria-labelledby="como-comprar">
        <Eyebrow>Passo a passo</Eyebrow>
        <h2 id="como-comprar" className="mb-6 font-display text-2xl font-semibold tracking-tight text-marinho">
          Como comprar
        </h2>
        <div className="relative">
          {/* Linha que conecta os passos (só no computador). */}
          <div className="absolute left-[16%] right-[16%] top-14 hidden h-px bg-gradient-to-r from-lilas via-rosa to-bebe sm:block" aria-hidden="true" />
          <RevealGroup directions={["left", "up", "right"]} className="relative grid gap-3 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-md border border-borda bg-white p-5 shadow-suave transition duration-300 ease-out hover:-translate-y-1 sm:text-center">
                <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lilas-soft to-rosa-soft text-marinho sm:h-14 sm:w-14">
                    <s.icon aria-hidden="true" className="h-6 w-6 sm:h-7 sm:w-7" />
                  </span>
                  <span aria-hidden="true" className="font-display text-4xl font-semibold leading-none text-marinho-texto/60 sm:text-5xl">
                    {s.n}
                  </span>
                </div>
                <p className="mt-3 font-display text-lg font-semibold text-marinho">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Faixa final em modo noite: fundo marinho com contraste alto e acentos lilás e rosa. */}
      <section className={`relative overflow-hidden rounded-lg bg-gradient-to-br from-marinho via-accent-800 to-marinho text-papel ${SECTION}`}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rosa/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-lilas/25 blur-3xl" aria-hidden="true" />
        {/* Marca d'água discreta com o símbolo da marca. */}
        <Image src="/brand/simbolo.png" alt="" width={320} height={256} aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-12 hidden h-auto w-72 rotate-12 opacity-15 lg:block" />
        <div className="relative grid items-center gap-8 px-6 py-10 text-center sm:px-10 sm:py-14 md:grid-cols-2 md:text-left">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <div className="rounded-lg bg-papel/95 p-3 shadow-lg">
              <Image src="/brand/logo-completa.webp" alt="Sonhos no Papel" width={140} height={164} className="h-auto w-24" />
            </div>
            <p className="max-w-md font-display text-2xl font-semibold text-papel">
              <Suspense fallback={BRAND.slogan}>
                <Slogan />
              </Suspense>
              .
            </p>
          </div>
          <div className="flex flex-col items-center gap-5 md:items-start">
            <p className="max-w-md text-papel/80">Ficou com dúvida sobre algum produto? Chame a gente no WhatsApp.</p>
            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              <ButtonLink href="/produtos" variant="secondary" className="min-h-11">
                Ver catálogo
              </ButtonLink>
              <Suspense fallback={null}>
                <WhatsAppCta />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <SocialLinks />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
