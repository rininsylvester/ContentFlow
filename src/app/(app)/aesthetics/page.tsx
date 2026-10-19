import { AestheticsTool } from "@/components/tools/aesthetics/aesthetics-tool";
import { ToolHeader } from "@/components/tools/tool-header";
import { findNavItem } from "@/lib/tools";

const item = findNavItem("aesthetics");
export const metadata = { title: item.label };

export default function AestheticsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <ToolHeader item={item} />
      <AestheticsTool />
    </div>
  );
}
