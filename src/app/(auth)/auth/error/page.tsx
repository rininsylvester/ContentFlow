import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Sign-in problem" };

export default function AuthErrorPage() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">That link didn&apos;t work</h1>
      <p className="text-sm text-muted-foreground">
        Sign-in links expire after a short time and can only be used once. Request a new one to
        continue.
      </p>
      <Button asChild>
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
