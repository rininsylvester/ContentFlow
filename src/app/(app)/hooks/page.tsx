import { ToolPlaceholderPage } from "@/components/tools/tool-placeholder-page";
import { findNavItem } from "@/lib/tools";

export const metadata = { title: findNavItem("hooks").label };

export default function HooksPage() {
  return <ToolPlaceholderPage id="hooks" phase={3} />;
}
