import { ScriptTool } from "@/components/tools/script/script-tool";
import { ToolHeader } from "@/components/tools/tool-header";
import { findNavItem } from "@/lib/tools";

const item = findNavItem("script");
export const metadata = { title: item.label };

export default function ScriptsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <ToolHeader item={item} />
      <ScriptTool />
    </div>
  );
}
