import Link from "next/link";
import { Suspense } from "react";
import { DemoSignIn } from "@/components/demo/demo-sign-in";
import { Skeleton } from "@/components/ui/skeleton";
import { isE2EAuthEnabled } from "@/lib/e2e";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to CreatorHub</h1>
        <p className="text-sm text-muted-foreground">
          New here? Signing in creates your account — with 5 free generations.
        </p>
      </div>
      {isE2EAuthEnabled() && <DemoSignIn />}
      <Suspense fallback={<Skeleton className="h-52 w-full" />}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
