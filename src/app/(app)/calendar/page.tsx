import { ToolPlaceholderPage } from "@/components/tools/tool-placeholder-page";
import { findNavItem } from "@/lib/tools";

export const metadata = { title: findNavItem("calendar").label };

export default function CalendarPage() {
  return <ToolPlaceholderPage id="calendar" phase={4} />;
}
