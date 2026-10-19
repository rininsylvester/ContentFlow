import { ToolPlaceholderPage } from "@/components/tools/tool-placeholder-page";
import { findNavItem } from "@/lib/tools";

export const metadata = { title: findNavItem("ideas").label };

export default function IdeasPage() {
  return <ToolPlaceholderPage id="ideas" phase={2} />;
}
