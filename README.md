# Pequenos Passos

SaaS educacional com Next.js 16 (App Router), React 19, Prisma + PostgreSQL, Auth.js (Google), Stripe, Vercel AI Gateway, Sentry, Upstash e PWA.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui (Base UI)
- Prisma 7 + PostgreSQL
- Auth.js v5 (Google OAuth)
- Stripe (Checkout + Webhook)
- Vercel AI Gateway + AI SDK (Gemini)
- Sentry (`@sentry/nextjs`)
- Upstash Redis (rate limit)
- @ducanh2912/next-pwa

## Scripts principais

```bash
npm run dev
npm run lint
npm run build

npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
npm run db:push
npm run db:seed
npm run db:status

npm run deploy:vercel
```

## Setup local

1. Copie `.env.example` para `.env.local`.
2. Preencha todas as variaveis com credenciais reais.
3. Instale dependencias:

```bash
npm install
```

4. Gere Prisma Client e aplique migrations quando houver alteração de schema:

```bash
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

5. Rode o app:

```bash
npm run dev
```

### Requisitos obrigatorios para autenticacao e dados reais

- O login funciona apenas com Google OAuth real (`AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`).
- O app usa `DATABASE_URL`; o Prisma CLI usa `DIRECT_URL` quando disponível. Para Supabase com pooler, o `prisma.config.ts` monta o host direto `db.<project>.supabase.co:5432` para migrations.
- Nao existe fallback para banco local nem modo demonstracao.

## Variaveis de ambiente obrigatorias

Use os nomes exatamente como em `.env.example`:

- NODE_ENV
- NEXT_PUBLIC_APP_URL
- AUTH_SECRET
- AUTH_GOOGLE_ID
- AUTH_GOOGLE_SECRET
- DATABASE_URL
- DIRECT_URL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_STORAGE_BUCKET
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_MONTHLY
- STRIPE_PRICE_YEARLY
- STRIPE_UPGRADE_URL
- SENTRY_DSN (opcional)
- NEXT_PUBLIC_SENTRY_DSN (opcional)
- CRON_SECRET

Em deploys Vercel, a avaliação com IA usa o `VERCEL_OIDC_TOKEN` provisionado automaticamente. Para desenvolvimento fora da Vercel, configure `AI_GATEWAY_API_KEY`.

## Deploy em producao (Vercel)

### 1) Autenticacao da CLI

```bash
vercel login
```

### 2) Configurar ambiente no projeto Vercel

- Adicione todas as variaveis acima em Production.
- Configure `NEXT_PUBLIC_APP_URL` com o dominio final.
- Defina `CRON_SECRET` (usado por `/api/cron/hard-delete`).

### 3) Banco (Prisma)

Este repositorio ja possui migration inicial em `prisma/migrations/20260331120000_init`.

Para banco novo (vazio):

```bash
npm run db:migrate:deploy
```

### 4) Integracoes externas

- Google OAuth: adicionar callback
	- `https://SEU_DOMINIO/api/auth/callback/google`
- Stripe Webhook: endpoint
	- `https://SEU_DOMINIO/api/stripe/webhook`
	- eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Sentry: configurar DSN(s) no projeto.

### 5) Publicar

```bash
npm run deploy:vercel
```

## Cron de limpeza

`vercel.json` agenda `GET /api/cron/hard-delete` diariamente (`17 3 * * *`).

O endpoint exige `Authorization: Bearer <CRON_SECRET>` e a Vercel injeta automaticamente esse header quando `CRON_SECRET` esta definido no projeto.

## Validacao minima antes do go-live

```bash
npm run lint
npm run build
```
