import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { getUsageSummary } from "@/lib/db/queries/usage";
import { UsageMeter } from "./usage-meter";
import { UserMenu } from "./user-menu";

/** Request-time section of the sidebar: reads the session, so render it inside <Suspense>. */
export async function SidebarAccount() {
  const user = await getCurrentUser();
  const usage = await getUsageSummary(user);
  return (
    <div className="flex flex-col gap-2">
      <UsageMeter usage={usage} />
      <UserMenu email={user.email} displayName={user.displayName} />
    </div>
  );
}

export function SidebarAccountSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <Skeleton className="h-[86px] w-full group-data-[collapsed=true]/sidebar:hidden" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
