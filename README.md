# CreatorHub

An AI content studio for creators: ideas, scripts, hooks, SEO metadata and visual direction for
YouTube, TikTok, Instagram, podcasts and blogs. One plan at $5/month, with 5 free generations to start.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript (strict) · Tailwind CSS v4 +
shadcn/ui · Supabase (Postgres + Auth) · Drizzle ORM · Anthropic Claude · Stripe · Zod · Vitest ·
Playwright.

> Build status: **Phase 1 — scaffold, auth, schema, app shell.** Later phases add the AI tools,
> library, calendar and billing.

## Getting started

### 1. Prerequisites

- Node.js 22+ and pnpm 10 (`corepack enable`)
- A Supabase project (free tier is fine)

### 2. Install and configure

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
```

| Variable                               | Where to find it                                                      |
| -------------------------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | `http://localhost:3000` locally, your domain in production            |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API → Project URL                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → publishable key              |
| `DATABASE_URL`                         | Supabase → Connect → Transaction pooler (port 6543) connection string |

### 3. Configure Supabase Auth

In the Supabase dashboard:

1. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (your production domain later)
   - Redirect URLs: add `http://localhost:3000/auth/callback` and `https://YOUR-DOMAIN/auth/callback`
2. **Authentication → Sign In / Providers**
   - Email: enabled (magic link).
   - Google: enable it and paste a Google OAuth client ID/secret. In Google Cloud Console, set the
     authorized redirect URI to `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.

### 4. Run the database migrations

```bash
pnpm db:migrate
```

This creates all tables, enums, indexes and Row Level Security policies, plus a trigger that creates
a `public.users` profile row whenever someone signs up.

### 5. Run the app

```bash
pnpm dev     # http://localhost:3000
```

## Scripts

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `pnpm dev`         | Start the dev server                          |
| `pnpm build`       | Production build                              |
| `pnpm check`       | Typecheck + lint + format check + unit tests  |
| `pnpm test`        | Unit tests (Vitest)                           |
| `pnpm db:generate` | Generate a migration after editing the schema |
| `pnpm db:migrate`  | Apply pending migrations                      |
| `pnpm db:studio`   | Browse the database with Drizzle Studio       |

## Architecture notes

- **Auth.** `src/proxy.ts` (Next 16's replacement for middleware) refreshes the Supabase session
  and redirects signed-out users away from app routes. That redirect is only an optimistic check:
  authorization actually happens in the data access layer (`src/lib/auth.ts`), which verifies the
  JWT on every request.
- **Database access.** Drizzle connects with a privileged role that **bypasses RLS**, so every
  query lives in `src/lib/db/queries/*` and is scoped by the verified user id. RLS policies are
  still enabled on every table as a second layer of protection for anything that reaches Supabase
  directly from the browser.
- **Cache Components.** Anything that reads the session renders inside `<Suspense>`, so the app
  shell and landing page are prerendered as static HTML and only the per-user parts stream in.
- **Plan limits** live in one place: `src/lib/billing/plan.ts`.
