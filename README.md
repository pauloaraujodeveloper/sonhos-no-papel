# Sonhos no Papel

Loja virtual e painel administrativo da papelaria. Requisitos em [docs/PRD-v1.2.md](docs/PRD-v1.2.md).

**Modelo do MVP:** o cliente monta o carrinho e finaliza pelo WhatsApp. A proprietária envia o Pix pelo WhatsApp e registra o pagamento no painel. O pagamento online fica desligado (`ONLINE_PIX_ENABLED=false`).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · PostgreSQL no Neon via Prisma 6 · Zod · Vitest · Vercel.

## Estrutura

```
prisma/        schema.prisma, migrations/ e seed.ts
public/brand/  logos
src/app/       (loja) site público · admin/ painel · api/ pedidos, preço do carrinho e health
src/components/ admin · cart · catalog · site
src/lib/       auth · commerce (preço, entrega, WhatsApp) · orders · admin/actions · cart · catalog · db.ts
docs/          PRD
```

Camadas de segurança: toda página e Server Action do painel chama `requireAdmin()` no servidor; preços, estoque e entrega são **sempre recalculados no servidor** (o navegador só envia IDs e quantidades); pedidos usam transação e guardam o preço do momento da compra.

## Começar

```bash
npm install
cp .env.example .env        # ou: neon env pull (grava DATABASE_URL, etc. no .env)
npm run db:deploy           # aplica as migrações
npm run seed -- categorias  # 5 categorias do PRD
npm run dev
```

Criar o acesso ao painel (a senha não fica em arquivo; só o hash é salvo):

```bash
ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD='senha-forte-12+' ADMIN_ROLE=DEVELOPER npm run seed -- admin
```

Papéis: `OWNER` (proprietária), `DEVELOPER` (técnico), `EDITOR` (operação). Só OWNER e DEVELOPER alteram Configurações.

Dados de demonstração (opcional): `npm run seed -- demo` e, para remover, `npm run seed -- demo-remover`.

Verificações: `npm test` · `npm run typecheck` · `npm run lint` · `npm run build`.

## Rotas

Loja: `/` · `/produtos` · `/categoria/[slug]` · `/produto/[slug]` · `/carrinho` · `/checkout`
Painel: `/admin` (dashboard) · `/admin/pedidos` · `/admin/produtos` · `/admin/categorias` · `/admin/estoque` · `/admin/configuracoes`

## Neon e deploy (Vercel)

- Variáveis: `DATABASE_URL` (pooled, usada pelo app), `DATABASE_URL_UNPOOLED` (direta, usada pelas migrações), `NEON_AUTH_*`, `SESSION_SECRET` (mín. 32 caracteres) e `NEXT_PUBLIC_SITE_URL`. Cadastre-as na Vercel em Settings → Environment Variables.
- Banco de teste isolado: `neon checkout teste --create` (volte com `neon checkout production`).
- Antes da primeira publicação: `npm run db:deploy` com a URL direta.
- O WhatsApp da loja é configurado no painel (Configurações). Sem ele o checkout não finaliza pedidos.

## Pix (standby)

O site não cobra Pix: a chave cadastrada em Configurações aparece só na mensagem que a proprietária envia pelo WhatsApp. Existe um gerador de BR Code com CRC16 em `src/lib/pix.ts`, **não usado** no MVP. Para ativar um dia: `ONLINE_PIX_ENABLED=true` (checado em `src/lib/features.ts`), um provedor Pix com webhook assinado e idempotente, e homologação. Estados de pagamento: não informado → aguardando → em análise → pago (ou cancelado/estornado); "pago" só pela proprietária.

## Pendências

Upload de imagens (hoje por link https) · banners e aparência · liberação automática das reservas de 48 h · limite de requisições em armazenamento compartilhado · sitemap/robots · deploy.

## Notas

- Valores em centavos (inteiros). Exclusão lógica em produtos. `CHECK`s de estoque na migração SQL (o Prisma 6 não os expressa no schema).
- `npm audit` aponta falhas só em ferramentas de desenvolvimento (Vitest/Vite, CLI do Prisma); não entram no bundle de produção. Revisar antes do deploy.
