import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { skipOnboarding } from "./actions";

export const metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pt-8">
      <Card>
        <CardHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <CardTitle className="text-2xl">Welcome to CreatorHub</CardTitle>
          <CardDescription>
            You have 5 free generations to try every tool, no card needed. The 3-step brand voice
            setup arrives in Phase 4. For now, jump straight in.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tip: press <kbd className="rounded border bg-muted px-1.5 font-mono text-xs">⌘K</kbd>{" "}
          anywhere to jump between tools.
        </CardContent>
        <CardFooter>
          <form action={skipOnboarding}>
            <Button type="submit">
              Go to the Idea Generator
              <ArrowRight />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
