import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

/** A titled output block with a one-click copy button. */
export function ResultCard({
  title,
  copyText,
  children,
  className,
  actions,
}: {
  title: string;
  copyText?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 text-card-foreground shadow-sm", className)}>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="flex-1 text-sm font-medium">{title}</h3>
        {actions}
        {copyText ? <CopyButton text={copyText} label={`Copy ${title.toLowerCase()}`} /> : null}
      </div>
      {children}
    </div>
  );
}
