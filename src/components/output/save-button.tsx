"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveItem } from "@/lib/actions/save-item";
import type { Tool } from "@/lib/db/schema/enums";

export function SaveButton({
  tool,
  title,
  content,
  generationId,
}: {
  tool: Tool;
  title: string;
  content: Record<string, unknown>;
  generationId?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      disabled={pending || saved}
      onClick={() =>
        start(async () => {
          const res = await saveItem({ tool, title, content, generationId });
          if (res.ok) {
            setSaved(true);
            toast.success("Saved to your library");
          } else toast.error(res.error);
        })
      }
    >
      {saved ? <BookmarkCheck /> : <Bookmark />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
