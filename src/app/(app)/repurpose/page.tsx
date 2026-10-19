import { RepurposeTool } from "@/components/tools/repurpose/repurpose-tool";
import { ToolHeader } from "@/components/tools/tool-header";
import { findNavItem } from "@/lib/tools";

const item = findNavItem("repurpose");
export const metadata = { title: item.label };

export default function RepurposePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <ToolHeader item={item} />
      <RepurposeTool />
    </div>
  );
}
