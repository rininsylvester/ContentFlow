"use client";

import { Loader2, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Shown on the login page only when local demo sign-in is enabled (dev server). */
export function DemoSignIn() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/e2e/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "demo@creatorhub.local", name: "Demo Creator" }),
    }).catch(() => null);
    if (!res?.ok) {
      setPending(false);
      setError("Demo sign-in failed. Is the demo database running?");
      return;
    }
    const { onboarded } = (await res.json()) as { onboarded: boolean };
    window.location.href = onboarded ? "/ideas" : "/onboarding";
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
      <p className="text-sm font-medium">Local demo mode</p>
      <p className="text-xs text-muted-foreground">
        No accounts or keys needed. AI returns sample output and payments are simulated.
      </p>
      <Button type="button" className="w-full" onClick={signIn} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <PlayCircle />}
        Continue with demo account
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
