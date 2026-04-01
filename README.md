# Planejei

SaaS educacional com Next.js 14 (App Router), Prisma + PostgreSQL, Auth.js (Google), Stripe, Gemini, Sentry, Upstash e PWA.

## Stack

- Next.js 14 + TypeScript
- Tailwind + shadcn/ui (Base UI)
- Prisma 7 + PostgreSQL
- Auth.js v5 (Google OAuth)
- Stripe (Checkout + Webhook)
- Gemini API (`@google/genai`)
- Sentry (`@sentry/nextjs`)
- Upstash Redis (rate limit)
- next-pwa

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
2. Preencha todas as variaveis.
3. Instale dependencias:

```bash
npm install
```

4. Gere Prisma Client:

```bash
npm run db:generate
```

5. Rode o app:

```bash
npm run dev
```

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
- GEMINI_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_MONTHLY
- STRIPE_PRICE_YEARLY
- STRIPE_UPGRADE_URL
- SENTRY_DSN (opcional)
- NEXT_PUBLIC_SENTRY_DSN (opcional)
- CRON_SECRET

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
