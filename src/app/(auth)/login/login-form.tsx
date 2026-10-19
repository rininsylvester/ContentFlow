"use client";

import { Loader2, MailCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signInWithEmail, signInWithGoogle, type LoginState } from "./actions";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signInWithEmail, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <div role="status" className="space-y-3 rounded-lg border p-6 text-center">
        <MailCheck className="mx-auto size-8 text-primary" aria-hidden />
        <p className="font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link to{" "}
          <span className="font-medium text-foreground">{state.email}</span>.
        </p>
      </div>
    );
  }

  const error = state.status === "error" ? state.message : null;

  return (
    <div className="space-y-4">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="outline" className="w-full">
          <GoogleIcon />
          Continue with Google
        </Button>
      </form>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
      <form action={formAction} className="space-y-3" noValidate>
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            defaultValue={state.status === "error" ? state.email : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "email-error" : undefined}
          />
          {error && (
            <p id="email-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Email me a sign-in link
        </Button>
      </form>
    </div>
  );
}
