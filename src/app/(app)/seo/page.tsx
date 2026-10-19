import { ToolPlaceholderPage } from "@/components/tools/tool-placeholder-page";
import { findNavItem } from "@/lib/tools";

export const metadata = { title: findNavItem("seo").label };

export default function SeoPage() {
  return <ToolPlaceholderPage id="seo" phase={3} />;
}
