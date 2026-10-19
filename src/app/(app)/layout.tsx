import { Suspense } from "react";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { CommandPalette } from "@/components/shell/command-palette";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SidebarAccount, SidebarAccountSkeleton } from "@/components/shell/sidebar-account";
import { ThemeToggle } from "@/components/shell/theme-toggle";

export default function AppLayout({ children }: LayoutProps<"/">) {
  const account = (
    <Suspense fallback={<SidebarAccountSkeleton />}>
      <SidebarAccount />
    </Suspense>
  );

  return (
    <div className="flex min-h-svh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <AppSidebar footer={account} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <MobileNav footer={account} />
          <CommandPalette />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
