import { SeoTool } from "@/components/tools/seo/seo-tool";
import { ToolHeader } from "@/components/tools/tool-header";
import { findNavItem } from "@/lib/tools";

const item = findNavItem("seo");
export const metadata = { title: item.label };

export default function SeoPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <ToolHeader item={item} />
      <SeoTool />
    </div>
  );
}
