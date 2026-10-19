"use client";

import { Loader2, Search, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { libraryHref, type ParsedLibraryParams } from "@/lib/library/filters";
import { TOOL_NAV } from "@/lib/tools";
import type { Tool } from "@/lib/db/schema/enums";

export function LibraryFilters({ params, tags }: { params: ParsedLibraryParams; tags: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.q ?? "");
  const latest = useRef(params);

  useEffect(() => {
    latest.current = params;
  }, [params]);

  const navigate = (patch: Partial<ParsedLibraryParams>) =>
    startTransition(() => {
      // Changing a filter resets pagination.
      router.replace(libraryHref({ ...latest.current, limit: undefined, ...patch }), {
        scroll: false,
      });
    });

  // Debounce search typing.
  useEffect(() => {
    if (q === (latest.current.q ?? "")) return;
    const t = setTimeout(() => navigate({ q: q.trim() || undefined }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate is stable enough; only re-run on input
  }, [q]);

  const active = Boolean(params.q || params.tool || params.tag || params.favorites);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-64">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <label htmlFor="library-search" className="sr-only">
          Search your library
        </label>
        <Input
          id="library-search"
          type="search"
          placeholder="Search titles and content…"
          maxLength={200}
          className="pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="library-tool" className="sr-only">
          Filter by tool
        </label>
        <NativeSelect
          id="library-tool"
          className="w-44"
          value={params.tool ?? ""}
          onChange={(e) => navigate({ tool: (e.target.value || undefined) as Tool | undefined })}
        >
          <option value="">All tools</option>
          {TOOL_NAV.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </NativeSelect>
        {tags.length > 0 && (
          <>
            <label htmlFor="library-tag" className="sr-only">
              Filter by tag
            </label>
            <NativeSelect
              id="library-tag"
              className="w-36"
              value={params.tag ?? ""}
              onChange={(e) => navigate({ tag: e.target.value || undefined })}
            >
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </NativeSelect>
          </>
        )}
        <Button
          type="button"
          variant={params.favorites ? "secondary" : "outline"}
          size="sm"
          className="h-9"
          aria-pressed={params.favorites}
          onClick={() => navigate({ favorites: !params.favorites })}
        >
          <Star className={params.favorites ? "fill-current text-warning" : undefined} />
          Favorites
        </Button>
        {active && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => {
              setQ("");
              navigate({ q: undefined, tool: undefined, tag: undefined, favorites: false });
            }}
          >
            <X />
            Clear
          </Button>
        )}
        {pending && (
          <Loader2
            className="size-4 animate-spin text-muted-foreground"
            aria-label="Updating results"
          />
        )}
      </div>
    </div>
  );
}
