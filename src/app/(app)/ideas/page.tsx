import { IdeasTool } from "@/components/tools/ideas/ideas-tool";
import { ToolHeader } from "@/components/tools/tool-header";
import { findNavItem } from "@/lib/tools";

const item = findNavItem("ideas");
export const metadata = { title: item.label };

export default function IdeasPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <ToolHeader item={item} />
      <IdeasTool />
    </div>
  );
}
