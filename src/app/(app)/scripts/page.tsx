import { ToolPlaceholderPage } from "@/components/tools/tool-placeholder-page";
import { findNavItem } from "@/lib/tools";

export const metadata = { title: findNavItem("script").label };

export default function ScriptsPage() {
  return <ToolPlaceholderPage id="script" phase={2} />;
}
