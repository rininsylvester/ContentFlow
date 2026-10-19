import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { TOOL_NAV } from "@/lib/tools";

// Placeholder landing page — the full landing (demo, pricing, FAQ) ships in Phase 6.
export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Logo />
        <Button asChild variant="ghost">
          <Link href="/login">Sign in</Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-12 px-4 py-16 text-center sm:py-24">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Your AI content studio, from idea to upload.
          </h1>
          <p className="text-lg text-pretty text-muted-foreground">
            Ideas, scripts, hooks, SEO and visual direction for YouTube, TikTok, Instagram, podcasts
            and blogs. One dashboard, $5/month.
          </p>
          <Button asChild size="lg">
            <Link href="/login">
              Start free — 5 generations
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <ul className="grid w-full gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {TOOL_NAV.map((tool) => (
            <li key={tool.id} className="rounded-xl border bg-card p-5">
              <tool.icon className="mb-3 size-5 text-primary" aria-hidden />
              <h2 className="font-medium">{tool.label}</h2>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
