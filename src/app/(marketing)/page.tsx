import { ArrowRight, Check, ChevronDown, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLAN } from "@/lib/billing/plan";
import { TOOL_NAV, WORKSPACE_NAV } from "@/lib/tools";
import demo from "../../../public/screenshots/idea-generator.webp";

const FEATURES = [
  ...TOOL_NAV,
  ...WORKSPACE_NAV,
  {
    id: "brand-voice",
    label: "Brand Voice",
    description: "Save your niche, audience and tone once. Every generation sounds like you.",
    icon: UserRound,
  },
];

const STEPS = [
  {
    title: "Tell us how you sound",
    body: "A one-minute brand voice setup: niche, audience, tone and words you love or avoid.",
  },
  {
    title: "Generate in seconds",
    body: "Ideas, scripts, hooks, SEO and visual direction stream in while you watch. Edit anything.",
  },
  {
    title: "Plan and publish",
    body: "Save the keepers to your library and drag them onto your content calendar.",
  },
];

const PRICING_FEATURES = [
  `${PLAN.monthlyGenerationCap} generations every month`,
  "All six AI tools",
  "Brand voice in every generation",
  "Library, search and tags",
  "Content calendar with drag and drop",
  "Copy and export to Markdown or TXT",
];

const FAQ = [
  {
    q: "Is there a free trial?",
    a: `Yes. Every new account gets ${PLAN.trialGenerations} free generations to try every tool — no card required.`,
  },
  {
    q: "What counts as a generation?",
    a: "Each request you make counts as one: a set of 10 ideas, a script, 15 hooks, an SEO pack, a visual direction, a repurposing run, expanding an idea or regenerating a script section. If a generation fails on our side, it doesn't count.",
  },
  {
    q: `Why is there a ${PLAN.monthlyGenerationCap}-generation monthly limit?`,
    a: `It keeps the price at $${PLAN.priceUsdMonthly}. ${PLAN.monthlyGenerationCap} generations is more than 13 a day — plenty for almost every creator. Your allowance resets with each billing period.`,
  },
  {
    q: "Are the SEO keywords based on real search data?",
    a: "No — they're AI-suggested based on how people typically search, and we label them that way. Use them as a starting point and validate important keywords with a search tool.",
  },
  {
    q: "Who owns what I create?",
    a: "You do. Use anything you generate however you like, commercially or otherwise.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel in one click from the billing portal. You keep access until the end of the period you've paid for.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[28rem] max-w-4xl rounded-full bg-primary/20 blur-3xl"
        />
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 pt-16 pb-12 text-center sm:pt-24">
          <p className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
            For YouTubers, TikTokers, podcasters, bloggers and every creator in between
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Your AI content studio, from idea to upload.
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
            Generate ideas, scripts, hooks, SEO metadata and visual direction — in your voice — then
            plan it all on one calendar. One dashboard, ${PLAN.priceUsdMonthly}/month.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">
                Start free — {PLAN.trialGenerations} generations
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#features">See the tools</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">No credit card required.</p>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-20">
          <figure className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-primary/10">
            <div className="flex items-center gap-1.5 border-b px-4 py-2.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            </div>
            <Image
              src={demo}
              alt="The CreatorHub Idea Generator showing ten generated content ideas, each with a hook, angle, reason it works and difficulty."
              sizes="(min-width: 1152px) 1120px, 100vw"
              placeholder="blur"
              className="h-auto w-full"
            />
            <figcaption className="sr-only">Idea Generator</figcaption>
          </figure>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-t bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Everything you need to create, in one place
            </h2>
            <p className="mt-3 text-muted-foreground">
              Six AI tools plus a workspace to keep it all organised.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.id} className="rounded-xl border bg-card p-6">
                <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" aria-hidden />
                </span>
                <h3 className="font-semibold">{f.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">How it works</h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2">
                <span className="flex size-9 items-center justify-center rounded-full border font-mono text-sm text-primary">
                  {i + 1}
                </span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 border-t bg-muted/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20">
          <h2 className="text-3xl font-semibold tracking-tight">Simple pricing</h2>
          <p className="mt-3 text-muted-foreground">One plan with every tool. Try it free first.</p>
          <div className="mt-10 w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl shadow-primary/5">
            <h3 className="font-semibold">{PLAN.name}</h3>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-semibold tracking-tight">${PLAN.priceUsdMonthly}</span>
              <span className="text-muted-foreground">/ month</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {PRICING_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 w-full">
              <Link href="/login">Start with {PLAN.trialGenerations} free generations</Link>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              No card for the trial. Cancel anytime. Fair use: {PLAN.monthlyGenerationCap}{" "}
              generations per month.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 border-t">
        <div className="mx-auto w-full max-w-3xl px-4 py-20">
          <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="divide-y rounded-xl border">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Your next video starts here.
          </h2>
          <Button asChild size="lg">
            <Link href="/login">
              Start free
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
