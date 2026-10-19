import { HooksTool } from "@/components/tools/hooks/hooks-tool";
import { ToolHeader } from "@/components/tools/tool-header";
import { findNavItem } from "@/lib/tools";

const item = findNavItem("hooks");
export const metadata = { title: item.label };

export default function HooksPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <ToolHeader item={item} />
      <HooksTool />
    </div>
  );
}
