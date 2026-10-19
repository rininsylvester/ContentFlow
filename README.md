# CreatorHub

An AI content studio for creators. Generate ideas, scripts, hooks, SEO metadata and visual
direction for YouTube, TikTok, Instagram, podcasts and blogs, in your own brand voice, then plan
it all on a content calendar. There's one plan at **$5/month**, and new accounts start with
**5 free generations**.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript (strict) · Tailwind CSS v4 +
shadcn/ui · Supabase (Postgres + Auth) · Drizzle ORM · Anthropic Claude (Haiku 5.5) · Stripe ·
Zod · Vitest · Playwright.

## Features

| Area                 | What it does                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Idea Generator       | 10 ideas (title, angle, hook, why it works, difficulty), each with Expand, Write script and Save                                   |
| Script Writer        | 3 hook options, timestamped sections, B-roll, on-screen text and CTA; inline editing, regenerate one section, Markdown/TXT export  |
| Hook & Title Lab     | 15 hooks across 5 frameworks, each with a reason and a score; filter and sort                                                      |
| SEO & Keywords       | Keywords, search intent, optimized title, description, tags and hashtags, labelled AI-suggested; pluggable keyword data provider   |
| Aesthetics Studio    | Palette swatches, live Google Fonts previews, mood, lighting, camera notes, thumbnail mock-ups, shot list                          |
| Caption & Repurposer | One piece of content turned into a TikTok/Reels caption, YouTube description, X/Threads thread, LinkedIn post and newsletter blurb |
| Brand Voice          | 3-step onboarding and a settings page; added to every prompt, with an off switch on each tool                                      |
| Library              | Full-text search and filters by tool, tag and favorites; duplicate, delete, add to calendar                                        |
| Content Calendar     | Month and week views; drag and drop by mouse, touch or keyboard; status: idea → scripted → filmed → posted                         |
| Billing              | Stripe Checkout, Customer Portal and webhooks; 5-generation trial, then a 400-generation monthly fair-use cap                      |

## Local development

### Prerequisites

- Node.js 22+ and pnpm 10 (`corepack enable`)
- A Supabase project (the free tier works), an Anthropic API key and a Stripe account (test mode)

### Setup

```bash
pnpm install
pnpm bootstrap   # creates .env.local, then checks and sets up everything it can
```

Fill in `.env.local` and run `pnpm bootstrap` again until it reports **All set**. It's safe to
re-run. Each time, it:

- validates the env vars;
- applies the database migrations;
- verifies your Anthropic key;
- checks that email and Google sign-in are enabled in Supabase Auth.

If you set `SUPABASE_ACCESS_TOKEN`, it also configures Supabase Auth's site URL, redirect URLs
and Google provider for you.

```bash
pnpm dev         # http://localhost:3000
```

Set `AI_MOCK=1` in `.env.local` to try every tool without an Anthropic key. Generations then
return sample output.

### Environment variables

| Variable                               | Where to find it                                                            |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | `http://localhost:3000` locally; your domain in production                  |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API → Project URL                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → publishable key                    |
| `DATABASE_URL`                         | Supabase → Connect → **Transaction pooler** (port 6543) connection string   |
| `ANTHROPIC_API_KEY`                    | console.anthropic.com → API Keys                                            |
| `STRIPE_SECRET_KEY`                    | Stripe → Developers → API keys                                              |
| `STRIPE_WEBHOOK_SECRET`                | Stripe → Developers → Webhooks → your endpoint → signing secret             |
| `STRIPE_PRICE_ID`                      | Stripe → Product catalog → CreatorHub Pro → $5/month price id (`price_...`) |
| `AI_MOCK` (dev only)                   | `1` returns sample AI output. Never set it in production.                   |
| `STRIPE_API_URL` (optional)            | Points the Stripe SDK at stripe-mock or another local fake                  |
| `SUPABASE_ACCESS_TOKEN` (optional)     | Lets `pnpm bootstrap` configure Supabase Auth. Read only by the script.     |

### Supabase Auth

`pnpm bootstrap` does this for you if `SUPABASE_ACCESS_TOKEN` is set. To do it by hand:

1. **Authentication → URL Configuration**
   - Site URL: your app URL.
   - Redirect URLs: `http://localhost:3000/auth/callback` and `https://YOUR-DOMAIN/auth/callback`.
     Add `https://*-YOUR-TEAM.vercel.app/auth/callback` for preview deployments.
2. **Authentication → Sign In / Providers**
   - Email: enabled (magic link).
   - Google: enabled, using a Google Cloud OAuth client whose authorized redirect URI is
     `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.

### Stripe

1. **Product catalog:** create **CreatorHub Pro** with a $5.00 USD monthly recurring price, and
   put its price id in `STRIPE_PRICE_ID`.
2. **Developers → Webhooks:** add an endpoint at `https://YOUR-DOMAIN/api/stripe/webhook` with
   these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

   Put its signing secret in `STRIPE_WEBHOOK_SECRET`.

3. **Settings → Billing → Customer portal:** enable it and allow customers to cancel and update
   their payment method.
4. **Local testing:** run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and use
   the `whsec_...` value it prints as `STRIPE_WEBHOOK_SECRET`.

## Deploying to Vercel

1. **Import the repository** in Vercel. The framework and pnpm are detected automatically. Set
   Node.js to 22.x under Project Settings → Build & Development.
2. **Environment variables:** add every variable from the table above for Production (and
   Preview if you use previews). Set `NEXT_PUBLIC_SITE_URL` to your production URL, for example
   `https://creatorhub.app`. Don't set `AI_MOCK`.
3. **Database:** use the Supabase **transaction pooler** connection string (port 6543) as
   `DATABASE_URL`. Then apply the migrations once from your machine:
   ```bash
   DATABASE_URL="postgresql://...:6543/postgres" pnpm db:migrate
   ```
4. **Supabase Auth:** add the production `.../auth/callback` URL to the allowed redirect URLs and
   set the Site URL (see above).
5. **Stripe:** switch to live mode, create the product and price, the webhook endpoint for your
   domain and the Customer Portal configuration. Use the live keys in Vercel.
6. **Deploy.** Then check the following:
   - The landing page loads, and sign-in works by email link and by Google.
   - Onboarding appears for a new account, and a generation streams in.
   - The 6th generation shows the paywall, Checkout completes, and the billing page shows
     **Active**.
   - Stripe → Webhooks shows successful (2xx) deliveries.

Generation requests can stream for up to 120 seconds (`maxDuration` on `/api/ai/[task]`), which
needs Vercel's Fluid compute; it's on by default for new projects.

## Scripts

| Command                 | What it does                                                |
| ----------------------- | ----------------------------------------------------------- |
| `pnpm dev`              | Dev server                                                  |
| `pnpm build` / `start`  | Production build / server                                   |
| `pnpm bootstrap`        | Check and set up env, database, Anthropic and Supabase Auth |
| `pnpm check`            | Typecheck + lint + format check + unit tests                |
| `pnpm test`             | Unit tests (Vitest)                                         |
| `pnpm test:integration` | Pipeline, billing and data tests against Postgres           |
| `pnpm test:e2e`         | Playwright smoke test and accessibility scans               |
| `pnpm db:generate`      | Generate a migration after changing the schema              |
| `pnpm db:migrate`       | Apply pending migrations                                    |
| `pnpm db:studio`        | Browse the database                                         |

## Testing

- **Unit tests (Vitest):**
  - usage and paywall logic, entitlements;
  - Stripe webhook handlers, status mapping and signature verification;
  - AI output parsing, the partial-JSON streaming parser and prompt inputs;
  - export, dates, filters, fonts and colors.
- **Integration tests:** these run against a real Postgres with the AI mocked. They cover:
  - generation reserve → stream → validate → record → refund;
  - race-safe trial limits, the subscriber cap and rate limiting;
  - webhooks → database → entitlements;
  - Library and calendar access isolation between users.
- **End-to-end tests (Playwright):**
  - sign up → generate 5 times → the 6th shows the paywall;
  - an axe-core WCAG 2.1 AA scan of every page.

  These run with a test-only sign-in that works only when `NODE_ENV=development` and
  `E2E_AUTH=1`. Production builds always answer 404 to it.

You need a Postgres database for the integration and end-to-end tests. The stub stands in for
Supabase's `auth` schema and roles:

```bash
psql "$TEST_DATABASE_URL" -f tests/integration/supabase-stub.sql   # once, on an empty database
DATABASE_URL="$TEST_DATABASE_URL" pnpm db:migrate
TEST_DATABASE_URL=... pnpm test:integration
TEST_DATABASE_URL=... pnpm test:e2e
```

CI (`.github/workflows/ci.yml`) runs all of the above on every push.

## Architecture

```
src/
  app/(marketing)/      landing, terms, privacy (static)
  app/(auth)/           login, auth error
  app/(app)/            the signed-in app: tools, library, calendar, settings
  app/api/ai/[task]/    single streaming endpoint for every AI task
  app/api/stripe/       checkout, portal, webhook
  lib/ai/               models, versioned prompts, Zod schemas, provider, pipeline
  lib/billing/          plan, entitlements, Stripe client, webhook handlers
  lib/db/               Drizzle schema + queries (every query takes the user id)
  lib/seo/              KeywordProvider interface (AI-suggested by default)
drizzle/                SQL migrations, including RLS policies and the signup trigger
```

- **AI:** `src/lib/ai/models.ts` is the only place model IDs and prices are defined. Every task
  uses **Claude Haiku 5.5**, the cheapest current model. Each request to `/api/ai/[task]`:
  1. checks the session and validates the input;
  2. applies the rate limit (10 per minute);
  3. reserves one generation from the trial or the monthly cap (race-safe);
  4. saves the input before calling the model;
  5. streams the output as NDJSON;
  6. validates the result with Zod, retrying once if it fails;
  7. logs tokens and cost.

  If the model output is invalid, the provider errors, or the request times out, the
  generation is refunded.

- **Auth:** `src/proxy.ts` makes optimistic redirects only. Real authorization is the data access
  layer (`src/lib/auth.ts`), which verifies the Supabase JWT.
- **Database access:** Drizzle connects with a role that bypasses RLS, so every query is scoped by
  the verified user id. RLS is also enabled on every table as a second layer of protection.
- **Security:**
  - Stripe webhook signatures are verified, and processed event ids are stored.
  - Billing POSTs must come from the app's own origin.
  - Inputs are validated with Zod.
  - AI output is rendered as text, never as raw HTML.
  - Security headers are set in `next.config.ts`.
- **Performance:** pages are Server Components by default, and the marketing pages are fully
  static. The landing page scores 97 on Lighthouse mobile performance and 100 for accessibility,
  best practices and SEO.

### Plugging in real keyword data

Implement `KeywordProvider` in `src/lib/seo/keyword-provider.ts` and return it from
`getKeywordProvider()`. The metrics are attached to every SEO result and shown next to each
keyword. If the provider fails, the generation still succeeds without metrics.
