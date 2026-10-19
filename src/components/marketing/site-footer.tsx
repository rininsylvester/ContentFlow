import Link from "next/link";
import { Logo } from "@/components/shell/logo";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <Logo className="text-foreground" />
        <p className="sm:ml-4">AI content studio for creators. $5/month.</p>
        <nav aria-label="Legal" className="flex gap-6 sm:ml-auto">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
