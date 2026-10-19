# Deploying CreatorHub to production

This guide takes you from an empty account to a live, paid product. Follow the sections in order.
Each one ends with the environment variables it produces.

| Step | Service                          | Time   | Produces                                                                           |
| ---- | -------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| 1    | Supabase (database, auth, email) | 30 min | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL` |
| 2    | Anthropic (AI)                   | 5 min  | `ANTHROPIC_API_KEY`                                                                |
| 3    | Stripe, test mode first          | 20 min | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`                    |
| 4    | Vercel (hosting)                 | 15 min | your live URL → `NEXT_PUBLIC_SITE_URL`                                             |
| 5    | End-to-end check in test mode    | 10 min | —                                                                                  |
| 6    | Switch Stripe to live mode       | 15 min | live Stripe values                                                                 |
| 7    | Launch checklist                 | —      | —                                                                                  |

Throughout this guide, `creatorhub.app` stands for your domain and `abcdefghijkl` stands for your
Supabase project ref. Replace both with your own.

You need:

- Node.js 22+ and pnpm 10 on your computer (`corepack enable`).
- A clone of the repo: `git clone https://github.com/rininsylvester/ContentFlow && cd ContentFlow && pnpm install`.

---

## 1. Supabase

### 1.1 Create the project

1. Go to <https://supabase.com/dashboard> and click **New project**.
2. Fill in the form:
   - **Name:** `creatorhub`.
   - **Database password:** click **Generate a password** and save it in your password manager.
     You'll need it in step 1.3.
   - **Region:** the region closest to most of your users. Note it down, because Vercel functions
     should run in the same region (step 4.2).
   - **Plan:** Free is fine for testing. Use **Pro** for production: free projects pause after a
     week without traffic and have no daily backups.
3. Click **Create new project** and wait about two minutes.

### 1.2 API URL and publishable key

1. In the project, click **Connect** (top bar) → **App Frameworks** → **Next.js**.
2. Copy the two values it shows:
   - `NEXT_PUBLIC_SUPABASE_URL`, for example `https://abcdefghijkl.supabase.co`.
   - The publishable key (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

   Both are also under **Project Settings → API Keys**.

> Never use the **secret** or **service_role** key. The app doesn't need it, and it bypasses all
> security rules.

### 1.3 Database connection strings

Click **Connect** → **Connection String**. You need two of the strings shown, and in both you
replace `[YOUR-PASSWORD]` with the password from step 1.1:

| Name                   | Port   | Used for                                            |
| ---------------------- | ------ | --------------------------------------------------- |
| **Transaction pooler** | `6543` | `DATABASE_URL` on Vercel (serverless needs pooling) |
| **Session pooler**     | `5432` | Running migrations from your computer (step 1.4)    |

They look like
`postgresql://postgres.abcdefghijkl:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres`.

> If the password contains `@ : / ? #` or `%`, URL-encode those characters (for example `@` → `%40`),
> or generate a new password without them.

### 1.4 Create the tables (run the migrations)

From the repo folder on your computer, using the **session pooler (5432)** string:

```bash
DATABASE_URL="postgresql://postgres.abcdefghijkl:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres" pnpm db:migrate
```

You should see `migrations applied successfully!`. Then check the dashboard:

- **Table Editor** (schema `public`) lists `users`, `brand_profiles`, `generations`, `saved_items`,
  `calendar_entries`, `usage_periods`, `stripe_events` and `rate_limits`, each marked
  **RLS enabled**.
- **Database → Triggers**: switch the schema to `auth`; it shows `on_auth_user_created` on
  `users`.
- **Advisors → Security Advisor** reports no "RLS disabled" errors.

Run the same command again whenever you pull a version of the app with new migrations
(`drizzle/` folder).

### 1.5 Auth URLs

Go to **Authentication → URL Configuration**:

1. **Site URL:** `https://creatorhub.app`. If you don't have a domain yet, use the Vercel URL from
   step 4 and come back to change it.
2. **Redirect URLs** → **Add URL**, once for each of these:
   - `https://creatorhub.app/auth/callback`
   - `http://localhost:3000/auth/callback` (local development)
   - `https://*-YOUR-VERCEL-TEAM.vercel.app/auth/callback` (Vercel preview deployments; optional)
3. Click **Save**.

### 1.6 Email (magic link) sign-in

1. Go to **Authentication → Sign In / Providers → Email**, make sure it's **enabled** and leave
   **Confirm email** on.
2. **Set up custom SMTP. This is required for production:** Supabase's built-in email only sends
   to your own team members and allows just a few emails per hour. Here's how with
   [Resend](https://resend.com) (free tier: 3,000 emails/month):
   1. Sign up at resend.com → **Domains** → **Add domain** → `creatorhub.app`. Add the DNS records
      it shows at your domain registrar and wait for **Verified**.
   2. Resend → **API Keys** → **Create API key** (permission: Sending access) → copy it.
   3. Supabase → **Authentication → Emails → SMTP Settings** → turn on **Enable custom SMTP** and
      fill in:
      - Sender email: `noreply@creatorhub.app` · Sender name: `CreatorHub`
      - Host: `smtp.resend.com` · Port: `465`
      - Username: `resend` · Password: the Resend API key
   4. **Save**.
   5. **Authentication → Rate Limits**: raise **Rate limit for sending emails** (for example to
      `100` per hour).
3. Optionally, go to **Authentication → Emails → Templates → Magic Link** and change the subject
   to `Your CreatorHub sign-in link`. Keep `{{ .ConfirmationURL }}` in the body.

### 1.7 Google sign-in

**In Google Cloud** (<https://console.cloud.google.com>):

1. Use the project picker → **New project** → name it `CreatorHub` → **Create**, then select it.
2. Open **APIs & Services → OAuth consent screen**; newer consoles call this **Google Auth
   Platform**. Click **Get started** and fill in:
   - App name `CreatorHub`, user support email, audience **External**, your contact email.
3. Go to **Branding**:
   - App home page `https://creatorhub.app`
   - Privacy policy `https://creatorhub.app/privacy`
   - Terms `https://creatorhub.app/terms`
   - Authorized domains: `creatorhub.app` and `abcdefghijkl.supabase.co`

   Click **Save**.

4. Go to **Clients → Create client**:
   - Application type **Web application**, name `CreatorHub web`.
   - **Authorized JavaScript origins:** `https://creatorhub.app` and `http://localhost:3000`.
   - **Authorized redirect URIs:** `https://abcdefghijkl.supabase.co/auth/v1/callback`. You can
     copy the exact value from Supabase's Google provider panel, where it's labelled
     "Callback URL".
   - Click **Create** and copy the **Client ID** and **Client secret**.
5. Go to **Audience → Publish app**. Until you publish, only test users you add by hand can sign
   in with Google.

**In Supabase**, go to **Authentication → Sign In / Providers → Google**. Enable it, paste the
Client ID and Client secret, and click **Save**.

> **Shortcut:** put the three Supabase values (steps 1.2–1.3) in `.env.local`, plus
> `SUPABASE_ACCESS_TOKEN` (from <https://supabase.com/dashboard/account/tokens>),
> `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` and
> `NEXT_PUBLIC_SITE_URL=https://creatorhub.app`. Then run `pnpm bootstrap`. It applies the
> migrations, sets the Site URL and redirect URLs, enables Google, and checks everything. You
> still need to do the SMTP setup (1.6) and the Google Cloud steps.

**Values from this section:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`DATABASE_URL` (the transaction pooler string, port 6543).

---

## 2. Anthropic (AI)

1. Sign up at <https://console.anthropic.com> and create your organization.
2. **Settings → Billing**: add a payment method and buy credits ($10–$20 is plenty to start).
   Turning on **auto-reload** prevents an outage when credits run out.
3. **Settings → Limits**: set a **monthly spend limit**, for example $50, as a safety cap.
   - **Cost reference:** every tool uses Claude Haiku 5.5 ($0.10 / $0.50 per million input and
     output tokens).
   - A typical generation costs about $0.001–$0.003.
   - So a subscriber who uses all 400 monthly generations costs **under about $1.20**, against the
     $5 price.
4. **Settings → API Keys → Create Key**. Name it `creatorhub-production` (the Default workspace is
   fine), then copy it right away; it's shown only once.

**Value from this section:** `ANTHROPIC_API_KEY` (`sk-ant-...`).

The model is set in `src/lib/ai/models.ts`, so nothing else needs configuring. If you see
rate-limit errors as you grow, check **Settings → Limits** for your usage tier. Tiers increase as
you buy more credits.

---

## 3. Stripe (billing), in test mode first

Do this whole section in **test mode** first; step 6 repeats it in live mode. Test and live
objects are completely separate, and nothing carries over.

1. Sign up at <https://dashboard.stripe.com> and switch on **Test mode** (or open a **Sandbox**)
   using the toggle at the top.
2. **Create the product and price.** Go to **Product catalog → + Add product**:
   - Name `CreatorHub Pro`, description `400 AI generations per month, every tool`.
   - Pricing: **Recurring**, amount **5.00 USD**, billing period **Monthly**.
   - Click **Add product**. Open the product, click the price, and copy the **Price ID**
     (`price_...`). Don't copy the product ID (`prod_...`) by mistake.
3. **API key.** Go to **Developers → API keys** and copy the **Secret key** (`sk_test_...`).
4. **Customer portal.** This is what "Manage billing" opens; without it, that button fails. Go to
   **Settings → Billing → Customer portal** and click **Activate** if asked. Then:
   - Turn on **Customers can update payment methods**, **view invoice history** and
     **cancel subscriptions**. For cancellation, choose **At the end of the billing period**.
   - Leave plan switching off (there's only one plan).
   - Under business information, add your privacy and terms links, then **Save**.
5. **Webhook.** Go to **Developers → Webhooks** (in Workbench) → **Add destination** (older
   dashboards: **Add endpoint**):
   - Events from: **Your account**. API version: choose the **latest**.
   - Select exactly these 4 events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Destination: **Webhook endpoint**, URL `https://creatorhub.app/api/stripe/webhook`. If the
     domain isn't live yet, use your Vercel URL and edit this later.
   - Create it, then click **Reveal** under **Signing secret** and copy `whsec_...`.
6. **Failed-payment behaviour.** Go to **Settings → Billing → Revenue recovery** (some dashboards call it **Subscriptions and emails**):
   - Keep **Smart Retries** on. The app keeps access while Stripe retries a failed payment
     (`past_due`).
   - Choose what happens after all retries fail: **cancel the subscription** (recommended) or
     mark it unpaid. Either one ends access.
   - Turn on the customer emails for **successful payments** and **failed payments**.
7. **Tax** (optional): if you need to charge VAT or sales tax, set up **Stripe Tax** under
   **Settings → Tax**. Checkout doesn't add tax automatically yet; tell me if you need it.

**Values from this section:** `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.

---

## 4. Vercel (hosting)

1. **Prepare GitHub.** Merge PR #1 into `main`, then go to GitHub → **Settings → General →
   Default branch** → `main`.
2. **Import the project.** At <https://vercel.com/new>, import `rininsylvester/ContentFlow`
   (authorize the Vercel GitHub app if asked).
   - Next.js is detected automatically. Leave the root directory as `./` and keep the default
     build and install commands. pnpm is picked up from `package.json`.
   - Under **Settings → General**, set **Node.js Version** to **22.x**.
   - Under **Settings → Functions**, set **Function Region** to the region closest to your
     Supabase database:

     | Supabase region  | Vercel region |
     | ---------------- | ------------- |
     | `us-east-1`      | `iad1`        |
     | `eu-central-1`   | `fra1`        |
     | `ap-south-1`     | `bom1`        |
     | `ap-southeast-1` | `sin1`        |

   - Keep **Fluid compute** on (the default). AI generations can stream for up to 120 seconds.
3. **Environment variables.** Go to **Settings → Environment Variables** and add these for
   **Production**:

   | Name                                   | Value                                         |
   | -------------------------------------- | --------------------------------------------- |
   | `NEXT_PUBLIC_SITE_URL`                 | `https://creatorhub.app` (no trailing slash)  |
   | `NEXT_PUBLIC_SUPABASE_URL`             | from 1.2                                      |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from 1.2                                      |
   | `DATABASE_URL`                         | **transaction pooler (6543)** string from 1.3 |
   | `ANTHROPIC_API_KEY`                    | from 2                                        |
   | `STRIPE_SECRET_KEY`                    | from 3 (test key for now)                     |
   | `STRIPE_PRICE_ID`                      | from 3                                        |
   | `STRIPE_WEBHOOK_SECRET`                | from 3                                        |

   Don't set `AI_MOCK`, `E2E_AUTH`, `STRIPE_API_URL` or `SUPABASE_ACCESS_TOKEN` on Vercel.

4. **Deploy.** Click **Deploy** and wait for **Ready**.
5. **Domain.** Go to **Settings → Domains → Add** → `creatorhub.app`, then add the DNS record
   Vercel shows at your registrar. Once it's verified, make sure every place below uses the final
   domain, and **redeploy** after changing `NEXT_PUBLIC_*` values (they're baked in at build
   time):
   - `NEXT_PUBLIC_SITE_URL` (Vercel)
   - Supabase Site URL and redirect URLs (1.5)
   - Google origins (1.7)
   - Stripe webhook URL (3.5)
6. **Configuration check.** Go to **Vercel → Logs** and filter for `[config]`. If nothing shows
   up, every variable is set correctly. Otherwise the log lists exactly what's missing or wrong.

---

## 5. End-to-end check (Stripe test mode)

On the live site:

1. **Email sign-in:** open `/login`, enter your email, click the link in the email. The
   brand-voice onboarding should appear.
2. **Google sign-in:** sign out (avatar menu), then click **Continue with Google**.
3. **Generate:** open the Idea Generator and generate. Ideas should stream in.
   - Supabase **Table Editor → generations** should show a row with `status = succeeded`, token
     counts and `model = claude-haiku-5-5`.
4. **Paywall:** generate until the sidebar shows **5/5**. The next try opens the paywall.
5. **Checkout:** click **Subscribe for $5/month** and pay with the card `4242 4242 4242 4242`
   (any future date, any CVC, any ZIP).
   - You should land on **Billing**, which says **You're subscribed** and shows **0/400**.
   - **Stripe → Developers → Webhooks → your endpoint** should show `200` responses.
6. **Portal and cancellation:** **Billing → Manage billing** opens Stripe's portal. Cancel the
   plan and return; Billing should show **Cancels at period end** with the access-until date.
7. **Optional, failed payment:** in Stripe, open the customer → **Payment methods** → add the
   card `4000 0000 0000 0341` (it attaches fine, then fails when charged) and make it the
   default.
   - Use a [test clock](https://docs.stripe.com/billing/testing/test-clocks) to advance a month.
   - The user becomes **past due** but keeps access, and Billing shows a payment warning.

---

## 6. Switch Stripe to live mode

1. Stripe → **Activate payments**: enter your business details and bank account.
2. Turn **Test mode off**, then repeat **section 3, steps 2–6**: product and price, secret key
   (`sk_live_...`), customer portal, webhook (new `whsec_...`) and billing settings.
3. In Vercel, replace `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` and `STRIPE_WEBHOOK_SECRET` with the
   live values, then **redeploy**.
4. Make one real $5 purchase yourself to confirm it works, then refund it from Stripe if you like.

---

## 7. Launch checklist

- [ ] **Legal pages:** replace every `[placeholder]` in
      `src/app/(marketing)/terms/page.tsx` and `src/app/(marketing)/privacy/page.tsx` (company name,
      address, contact emails, governing law), and have a lawyer review them.
- [ ] **Supabase:** on the Pro plan, with backups enabled (**Database → Backups**), custom SMTP
      set up (1.6), and Google consent screen published (1.7).
- [ ] **Anthropic:** spend limit and auto-reload set (section 2).
- [ ] **Stripe:** live mode, webhook deliveries returning `200`, customer portal active.
- [ ] **Vercel:** no `[config]` warnings in the logs, custom domain on HTTPS.
- [ ] **Alerts:**
  - Vercel → **Settings → Notifications** (deployment failures)
  - Stripe → your profile → **Communication preferences** (failed webhooks)
  - Anthropic usage alerts
- [ ] **Keys:** rotate any key that was ever pasted into a chat, email or commit.

---

## Troubleshooting

| Symptom                                                                 | Fix                                                                                                                                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Magic link opens `localhost` or the wrong site                          | Supabase **Site URL** is wrong (1.5)                                                                                                                                     |
| "Invalid redirect URL" after sign-in                                    | Add `https://creatorhub.app/auth/callback` to Supabase **Redirect URLs** (1.5)                                                                                           |
| Google: `redirect_uri_mismatch`                                         | The Google client's redirect URI must be exactly `https://abcdefghijkl.supabase.co/auth/v1/callback` (1.7)                                                               |
| Google only works for some accounts                                     | Publish the consent screen (1.7, step 5)                                                                                                                                 |
| No sign-in email arrives                                                | Set up custom SMTP and raise the email rate limit (1.6)                                                                                                                  |
| "The AI service had a problem" / "AI generation isn't configured"       | `ANTHROPIC_API_KEY` is missing or out of credits. Check Vercel logs and Anthropic billing, then redeploy                                                                 |
| Subscribe returns to Billing with "couldn't reach the payment provider" | Wrong `STRIPE_PRICE_ID`, or test and live values mixed. Vercel logs show `[billing] checkout failed` with the reason                                                     |
| Paid, but still on the free plan                                        | Check the webhook deliveries in Stripe. A `400` means `STRIPE_WEBHOOK_SECRET` doesn't match that endpoint (test vs live); a `5xx` means a server error (see Vercel logs) |
| "Manage billing" fails                                                  | Activate the **Customer portal** in that Stripe mode (3.4)                                                                                                               |
| `pnpm db:migrate` fails with "Tenant or user not found"                 | The username must be `postgres.abcdefghijkl` (it includes the project ref), as in the Connect dialog                                                                     |
| `pnpm db:migrate` hangs or errors on port 6543                          | Use the **session pooler (5432)** string for migrations (1.4)                                                                                                            |
| Production database errors mentioning prepared statements               | `DATABASE_URL` on Vercel must be the **transaction pooler (6543)** string                                                                                                |
