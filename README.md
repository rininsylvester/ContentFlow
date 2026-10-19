# CreatorHub

An AI content studio for creators: ideas, scripts, hooks, SEO metadata and visual direction for
YouTube, TikTok, Instagram, podcasts and blogs. One plan at $5/month, with 5 free generations to start.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript (strict) · Tailwind CSS v4 +
shadcn/ui · Supabase (Postgres + Auth) · Drizzle ORM · Anthropic Claude · Stripe · Zod · Vitest ·
Playwright.

> Build status: **Phase 4 — workspace.** All six AI tools plus the Library, Brand Voice (with a
> 3-step onboarding) and the Content Calendar are done. Phase 5 adds Stripe billing.

## Getting started

### 1. Prerequisites

- Node.js 22+ and pnpm 10 (`corepack enable`)
- A Supabase project (free tier is fine)

### 2. Install and configure

```bash
pnpm install
pnpm bootstrap   # creates .env.local, then checks and sets up everything it can
```

`pnpm bootstrap` is safe to re-run. It validates your env vars, applies database migrations,
verifies your Anthropic key, checks that email and Google sign-in are enabled, and ends with a
list of anything still left to do. If you set `SUPABASE_ACCESS_TOKEN` (plus the optional
`GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`), it also configures Supabase Auth for
you: site URL, redirect URLs and the Google provider. That replaces step 3 below.

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

## AI layer

Everything AI-related lives in `src/lib/ai/` and runs only on the server.

- **Models:** `models.ts` is the only place model IDs and prices are defined. Every task currently
  uses **Claude Haiku 5.5** (`claude-haiku-5-5`), the cheapest current Claude model, at
  $0.10 / $0.50 per million input/output tokens. To move a task to a different model, change one
  line in `MODEL_FOR_TASK`.
- **Prompts:** each task has a versioned template in `prompts/<task>/v1.ts`. The version string
  is stored on every `generations` row.
- **Pipeline:** `POST /api/ai/[task]` runs these steps in order:
  1. Verify the session and validate the input with Zod.
  2. Apply the rate limit (10 requests per minute).
  3. Atomically reserve one generation from the trial or the monthly cap.
  4. Save the input as a `pending` generation.
  5. Stream the model output to the browser as NDJSON.
  6. Validate the final JSON against the task's schema, retrying once if it fails.
  7. Log tokens and the cost estimate.

  If the model output is invalid, the provider errors, or the request times out, the generation is
  refunded. Your input is always kept, both in the form and in the database.

- **Output safety:** model output is rendered only as React text nodes and never as raw HTML.

### Testing without accounts

`AI_MOCK=1` makes generations return deterministic sample data. The integration tests run the full
pipeline (reserve → stream → validate → record → refund) against a plain Postgres:

```bash
psql "$TEST_DATABASE_URL" -f tests/integration/supabase-stub.sql   # once, on an empty database
DATABASE_URL="$TEST_DATABASE_URL" pnpm db:migrate
TEST_DATABASE_URL=postgresql://... pnpm test:integration
```

### Plugging in real keyword data

SEO results are AI-suggested, and the UI says so clearly. To add live search volume, implement
`KeywordProvider` in `src/lib/seo/keyword-provider.ts` and return it from `getKeywordProvider()`.
The metrics are attached to every SEO result and shown next to each keyword. If the provider
fails, the generation still succeeds and simply shows no metrics.

## Workspace features

- **Brand voice** (`/settings/brand-voice`, plus a 3-step onboarding after signup): niche,
  platforms, audience, tone, words to use or avoid, and an example of your content. It's added to
  every prompt automatically, and each tool has a toggle to turn it off for one generation.
- **Library** (`/library`): everything you've saved.
  - Search runs across titles and content (Postgres full-text search).
  - Filter by tool, tag or favorites. Filters live in the URL, so they can be bookmarked.
  - Each item can be favorited, tagged, duplicated, deleted or added to the calendar.
- **Content calendar** (`/calendar`): month and week views.
  - Drag saved ideas and scripts onto a day, or drag entries between days. This works with a
    mouse, by touch (press and hold), or by keyboard (Space to pick up, arrow keys to move, Space
    to drop).
  - Each entry has a status (idea → scripted → filmed → posted), a platform and notes. Its date
    field is a second, non-drag way to move it.
