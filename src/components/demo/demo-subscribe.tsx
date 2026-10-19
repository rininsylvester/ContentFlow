import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Demo-only stand-in for Stripe Checkout. */
export function DemoSubscribeButton() {
  return (
    <form action="/api/e2e/subscribe" method="post">
      <Button type="submit" variant="outline">
        <FlaskConical />
        Activate demo subscription
      </Button>
    </form>
  );
}
