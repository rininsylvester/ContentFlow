import { CopyButton } from "./copy-button";

/** Inline chips with a copy-all button. */
export function TagList({ items, separator = ", " }: { items: string[]; separator?: string }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
          {item}
        </span>
      ))}
      <CopyButton text={items.join(separator)} label="Copy all" />
    </div>
  );
}
