import { findNavItem } from "@/lib/tools";
import { EmptyState } from "./empty-state";
import { ToolHeader } from "./tool-header";

/** Temporary page body for tools that land in a later build phase. */
export function ToolPlaceholderPage({ id, phase }: { id: string; phase: number }) {
  const item = findNavItem(id);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <ToolHeader item={item} />
      <EmptyState title={`${item.label} arrives in Phase ${phase}.`} examples={item.examples} />
    </div>
  );
}
