import Link from "next/link";
import { Logo } from "@/components/shell/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
      <Link
        href="/"
        className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Logo className="text-lg" />
      </Link>
      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
}
