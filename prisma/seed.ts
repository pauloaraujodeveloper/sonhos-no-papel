/**
 * Seeds do projeto, em um único arquivo. Uso:
 *
 *   npm run seed -- categorias     5 categorias do PRD + linha padrão de configurações (idempotente)
 *   npm run seed -- admin          cria/atualiza o administrador (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_ROLE, ADMIN_NAME)
 *   npm run seed -- demo           produtos de DEMONSTRAÇÃO (slug "demo-...")
 *   npm run seed -- demo-remover   remove os produtos de demonstração
 *
 * Lê o banco de DATABASE_URL (arquivo .env). A senha do admin nunca é gravada: só o hash scrypt.
 */
import { AdminRole, PrismaClient } from "@prisma/client";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/lib/auth/password";

const prisma = new PrismaClient();

// ---------- categorias ----------
const CATEGORIES = [
  { name: "Canetas", slug: "canetas", description: "Canetas para escrever, desenhar e organizar.", sortOrder: 1 },
  { name: "Lápis", slug: "lapis", description: "Lápis de escrever, de cor e para desenho.", sortOrder: 2 },
  { name: "Agendas", slug: "agendas", description: "Agendas para planejar cada dia com carinho.", sortOrder: 3 },
  { name: "Cadernos", slug: "cadernos", description: "Cadernos para estudar, criar e anotar.", sortOrder: 4 },
  { name: "Pincéis", slug: "pinceis", description: "Pincéis para pintura e lettering.", sortOrder: 5 },
];

async function categorias() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
    });
  }
  await prisma.storeSettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} });
  console.info(`Categorias garantidas: ${CATEGORIES.map((c) => c.slug).join(", ")}`);
}

// ---------- administrador ----------
const ROLES: AdminRole[] = ["OWNER", "DEVELOPER", "EDITOR"];

async function admin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administradora";
  const role = (process.env.ADMIN_ROLE?.trim().toUpperCase() || "OWNER") as AdminRole;

  if (!email?.includes("@")) throw new Error("Defina ADMIN_EMAIL com um e-mail válido.");
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Defina ADMIN_PASSWORD com pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  if (!ROLES.includes(role)) throw new Error(`ADMIN_ROLE inválido. Use: ${ROLES.join(", ")}.`);

  const passwordHash = await hashPassword(password);
  const user = await prisma.adminUser.upsert({
    where: { email },
    create: { email, name, passwordHash, role, active: true },
    update: { name, passwordHash, role, active: true },
    select: { id: true, email: true, role: true },
  });
  console.info(`Administrador pronto: ${user.email} (${user.role}), id ${user.id}`);
}

// ---------- demonstração ----------
type Demo = {
  slug: string; name: string; category: string; description: string; price: number; promo?: number;
  stock: number; featured?: boolean; isNew?: boolean; variants?: { name: string; delta?: number; stock: number }[];
};

const DEMO: Demo[] = [
  { slug: "demo-caneta-gel-pastel", name: "Caneta gel pastel", category: "canetas", description: "Tinta gel suave em tons pastel.", price: 1000, stock: 40, featured: true, isNew: true },
  { slug: "demo-caneta-fineliner", name: "Caneta fineliner 0.4", category: "canetas", description: "Ponta fina para detalhes.", price: 850, promo: 700, stock: 25 },
  { slug: "demo-lapis-de-cor-12", name: "Lápis de cor – caixa com 12", category: "lapis", description: "Cores vivas e macias.", price: 2400, stock: 18, featured: true },
  { slug: "demo-lapis-grafite-hb", name: "Lápis grafite HB", category: "lapis", description: "Clássico para escrever e rabiscar.", price: 300, stock: 3 },
  { slug: "demo-agenda-2027", name: "Agenda 2027", category: "agendas", description: "Planejamento diário com capa dura.", price: 5500, stock: 0, featured: true, isNew: true, variants: [{ name: "Azul", stock: 6 }, { name: "Rosa", delta: 200, stock: 4 }] },
  { slug: "demo-caderno-pontilhado", name: "Caderno pontilhado A5", category: "cadernos", description: "Folhas pontilhadas de 90 g.", price: 3500, promo: 3000, stock: 12, featured: true },
  { slug: "demo-caderno-universitario", name: "Caderno universitário", category: "cadernos", description: "96 folhas pautadas.", price: 2200, stock: 0 },
  { slug: "demo-pincel-chato", name: "Pincel chato nº 8", category: "pinceis", description: "Cerdas macias para aquarela.", price: 1500, stock: 15, isNew: true },
];

async function demo() {
  for (const p of DEMO) {
    const category = await prisma.category.findUnique({ where: { slug: p.category } });
    if (!category) throw new Error(`Categoria ausente: ${p.category}. Rode: npm run seed -- categorias`);
    if (await prisma.product.findUnique({ where: { slug: p.slug } })) continue;
    await prisma.product.create({
      data: {
        slug: p.slug, name: p.name, description: `${p.description} (Produto de demonstração)`,
        priceCents: p.price, promotionalPriceCents: p.promo ?? null, stockQuantity: p.stock,
        featured: p.featured ?? false, isNew: p.isNew ?? false, categoryId: category.id,
        variants: p.variants
          ? { create: p.variants.map((v) => ({ name: v.name, priceDeltaCents: v.delta ?? 0, stockQuantity: v.stock })) }
          : undefined,
      },
    });
  }
  console.info(`Produtos de demonstração garantidos: ${DEMO.length}`);
}

async function demoRemover() {
  const ids = (await prisma.product.findMany({ where: { slug: { startsWith: "demo-" } }, select: { id: true } })).map((p) => p.id);
  const used = await prisma.orderItem.count({ where: { productId: { in: ids } } });
  if (used > 0) {
    await prisma.product.updateMany({ where: { id: { in: ids } }, data: { active: false, deletedAt: new Date() } });
    console.info(`Produtos demo usados em pedidos foram desativados (${ids.length}).`);
    return;
  }
  const { count } = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  console.info(`Produtos de demonstração removidos: ${count}`);
}

const COMMANDS: Record<string, () => Promise<void>> = { categorias, admin, demo, "demo-remover": demoRemover };
const command = COMMANDS[process.argv[2] ?? ""];

(command ? command() : Promise.reject(new Error(`Use: npm run seed -- ${Object.keys(COMMANDS).join(" | ")}`)))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Falha no seed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
