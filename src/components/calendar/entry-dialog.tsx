"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORMS } from "@/lib/ai/options";
import type { CalendarEntryView } from "@/lib/db/queries/calendar";
import { CALENDAR_STATUSES, type CalendarStatus } from "@/lib/db/schema/enums";
import { STATUS_META } from "./status";

export type EntryPatch = {
  title: string;
  scheduledDate: string;
  status: CalendarStatus;
  platform: string | null;
  notes: string | null;
};

/** Edit an entry. The date field is also the keyboard/screen-reader way to move it. */
export function EntryDialog({
  entry,
  onOpenChange,
  onSave,
  onDelete,
}: {
  entry: CalendarEntryView | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: EntryPatch) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {entry && <EntryForm key={entry.id} entry={entry} onSave={onSave} onDelete={onDelete} />}
      </DialogContent>
    </Dialog>
  );
}

function EntryForm({
  entry,
  onSave,
  onDelete,
}: {
  entry: CalendarEntryView;
  onSave: (id: string, patch: EntryPatch) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<EntryPatch>({
    title: entry.title,
    scheduledDate: entry.scheduledDate,
    status: entry.status,
    platform: entry.platform,
    notes: entry.notes,
  });
  const set = <K extends keyof EntryPatch>(k: K, v: EntryPatch[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(entry.id, form);
      }}
    >
      <DialogHeader>
        <DialogTitle>Edit entry</DialogTitle>
        <DialogDescription>
          Update the plan, move it to another day, or track its progress.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="entry-title">Title</Label>
        <Input
          id="entry-title"
          required
          maxLength={300}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="entry-date">Date</Label>
          <Input
            id="entry-date"
            type="date"
            required
            value={form.scheduledDate}
            onChange={(e) => set("scheduledDate", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="entry-status">Status</Label>
          <NativeSelect
            id="entry-status"
            value={form.status}
            onChange={(e) => set("status", e.target.value as CalendarStatus)}
          >
            {CALENDAR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="entry-platform">Platform</Label>
        <NativeSelect
          id="entry-platform"
          value={form.platform ?? ""}
          onChange={(e) => set("platform", e.target.value || null)}
        >
          <option value="">Not set</option>
          {PLATFORMS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="entry-notes">Notes</Label>
        <Textarea
          id="entry-notes"
          rows={3}
          maxLength={2000}
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || null)}
        />
      </div>
      <DialogFooter className="sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive"
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 />
          Delete
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
}
