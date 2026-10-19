import { Library } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LibraryFilters } from "@/components/library/library-filters";
import { LibraryItemCard } from "@/components/library/library-item-card";
import { EmptyState } from "@/components/tools/empty-state";
import { ToolHeader } from "@/components/tools/tool-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { listSavedItems, listTags } from "@/lib/db/queries/saved-items";
import { libraryHref, PAGE_SIZE, parseLibraryParams } from "@/lib/library/filters";
import { findNavItem } from "@/lib/tools";

const item = findNavItem("library");
export const metadata = { title: item.label };

async function LibraryResults({
  searchParams,
}: {
  searchParams: PageProps<"/library">["searchParams"];
}) {
  const params = parseLibraryParams(await searchParams);
  const user = await getCurrentUser();
  const [{ items, hasMore }, tags] = await Promise.all([
    listSavedItems(user.id, params),
    listTags(user.id),
  ]);
  const filtered = Boolean(params.q || params.tool || params.tag || params.favorites);

  return (
    <div className="flex flex-col gap-6">
      <LibraryFilters params={params} tags={tags} />
      {items.length === 0 ? (
        filtered ? (
          <EmptyState title="Nothing matches those filters." />
        ) : (
          <EmptyState
            title="Your library is empty. Save anything you generate and it shows up here."
            examples={[
              "Generate ideas, then press Save on the ones you like",
              "Save a finished script from the Script Writer",
            ]}
          />
        )
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {items.length}
            {hasMore ? "+" : ""} {items.length === 1 ? "item" : "items"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((i) => (
              <LibraryItemCard key={i.id} item={i} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link
                  href={libraryHref({ ...params, limit: params.limit + PAGE_SIZE })}
                  scroll={false}
                >
                  Load more
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LibraryPage({ searchParams }: PageProps<"/library">) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <ToolHeader item={{ ...item, icon: Library }} />
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        }
      >
        <LibraryResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
