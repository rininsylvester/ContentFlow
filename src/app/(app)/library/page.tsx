import { ToolPlaceholderPage } from "@/components/tools/tool-placeholder-page";
import { findNavItem } from "@/lib/tools";

export const metadata = { title: findNavItem("library").label };

export default function LibraryPage() {
  return <ToolPlaceholderPage id="library" phase={4} />;
}
