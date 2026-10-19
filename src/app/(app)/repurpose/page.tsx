import { ToolPlaceholderPage } from "@/components/tools/tool-placeholder-page";
import { findNavItem } from "@/lib/tools";

export const metadata = { title: findNavItem("repurpose").label };

export default function RepurposePage() {
  return <ToolPlaceholderPage id="repurpose" phase={3} />;
}
