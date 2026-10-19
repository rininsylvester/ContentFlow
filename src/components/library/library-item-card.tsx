"use client";

import { CalendarPlus, Copy, Eye, MoreHorizontal, Star, Tags, Trash2 } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/output/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChipsInput } from "@/components/ui/chips-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scheduleSavedItemAction } from "@/lib/actions/calendar";
import {
  deleteItemAction,
  duplicateItemAction,
  setTagsAction,
  toggleFavoriteAction,
} from "@/lib/actions/library";
import { todayISO } from "@/lib/calendar/dates";
import type { LibraryItem } from "@/lib/db/queries/saved-items";
import { savedItemPreview, savedItemSwatches, savedItemToText } from "@/lib/library/format";
import { findNavItem } from "@/lib/tools";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type DialogKind = "view" | "tags" | "delete" | "schedule" | null;

export function LibraryItemCard({ item }: { item: LibraryItem }) {
  const tool = findNavItem(item.tool);
  const [favorite, setOptimisticFavorite] = useOptimistic(item.isFavorite);
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [tags, setTagsDraft] = useState(item.tags);
  const [date, setDate] = useState(todayISO());
  const text = savedItemToText(item.tool, item.content);
  const preview = savedItemPreview(item.tool, item.content);
  const swatches = savedItemSwatches(item.tool, item.content);
  const schedulable = item.tool === "ideas" || item.tool === "script";

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success?: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        if (success) toast.success(success);
        setDialog(null);
      } else toast.error(res.error ?? "Something went wrong.");
    });

  return (
    <article
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm"
      aria-labelledby={`item-${item.id}`}
    >
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <tool.icon aria-hidden />
          {tool.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {dateFormat.format(new Date(item.createdAt))}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={favorite}
          disabled={pending}
          onClick={() =>
            start(async () => {
              setOptimisticFavorite(!favorite);
              const res = await toggleFavoriteAction(item.id, !favorite);
              if (!res.ok) toast.error(res.error);
            })
          }
        >
          <Star className={cn(favorite ? "fill-current text-warning" : "text-muted-foreground")} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${item.title}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setDialog("view")}>
              <Eye />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDialog("tags")}>
              <Tags />
              Edit tags
            </DropdownMenuItem>
            {schedulable && (
              <DropdownMenuItem onSelect={() => setDialog("schedule")}>
                <CalendarPlus />
                Add to calendar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={() => run(() => duplicateItemAction(item.id), "Duplicated")}
            >
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setDialog("delete")}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="text-destructive" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <button
        type="button"
        onClick={() => setDialog("view")}
        className="-m-1 rounded-md p-1 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <h3 id={`item-${item.id}`} className="leading-snug font-semibold">
          {item.title}
        </h3>
        {preview && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{preview}</p>}
      </button>

      {swatches.length > 0 && (
        <div
          className="flex h-6 overflow-hidden rounded-md border"
          aria-label={`Palette: ${swatches.join(", ")}`}
        >
          {swatches.map((hex, i) => (
            <span key={`${hex}-${i}`} className="flex-1" style={{ backgroundColor: hex }} />
          ))}
        </div>
      )}

      {item.tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      )}

      <Dialog open={dialog === "view"} onOpenChange={(o) => setDialog(o ? "view" : null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{item.title}</DialogTitle>
            <DialogDescription>
              {tool.label} · saved {dateFormat.format(new Date(item.createdAt))}
            </DialogDescription>
          </DialogHeader>
          <pre className="rounded-lg bg-muted/50 p-4 font-sans text-sm whitespace-pre-wrap">
            {text}
          </pre>
          <DialogFooter>
            <CopyButton text={text} label="Copy" showLabel />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "tags"}
        onOpenChange={(o) => {
          setDialog(o ? "tags" : null);
          if (o) setTagsDraft(item.tags);
        }}
      >
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => setTagsAction(item.id, tags), "Tags updated");
            }}
            className="grid gap-4"
          >
            <DialogHeader>
              <DialogTitle>Edit tags</DialogTitle>
              <DialogDescription>
                Up to 10 tags. Press Enter or comma after each one.
              </DialogDescription>
            </DialogHeader>
            <Label htmlFor={`tags-${item.id}`} className="sr-only">
              Tags
            </Label>
            <ChipsInput
              id={`tags-${item.id}`}
              value={tags}
              onChange={setTagsDraft}
              max={10}
              placeholder="e.g. q3, launch"
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Save tags
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "schedule"} onOpenChange={(o) => setDialog(o ? "schedule" : null)}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => scheduleSavedItemAction(item.id, date), "Added to your content calendar");
            }}
            className="grid gap-4"
          >
            <DialogHeader>
              <DialogTitle>Add to calendar</DialogTitle>
              <DialogDescription>Pick the day you plan to post “{item.title}”.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor={`date-${item.id}`}>Date</Label>
              <Input
                id={`date-${item.id}`}
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete"} onOpenChange={(o) => setDialog(o ? "delete" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this item?</DialogTitle>
            <DialogDescription>
              “{item.title}” will be removed from your library. Calendar entries made from it are
              kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => run(() => deleteItemAction(item.id), "Deleted")}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
