import { ToolPlaceholderPage } from "@/components/tools/tool-placeholder-page";
import { findNavItem } from "@/lib/tools";

export const metadata = { title: findNavItem("aesthetics").label };

export default function AestheticsPage() {
  return <ToolPlaceholderPage id="aesthetics" phase={3} />;
}
