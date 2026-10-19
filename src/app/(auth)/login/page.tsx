import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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
      <Suspense fallback={<Skeleton className="h-52 w-full" />}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to our terms and privacy policy.
      </p>
    </div>
  );
}
