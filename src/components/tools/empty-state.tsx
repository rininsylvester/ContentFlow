import { Sparkles } from "lucide-react";

export function EmptyState({ title, examples }: { title: string; examples?: readonly string[] }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-8 text-center sm:p-12">
      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-5" aria-hidden />
      </span>
      <p className="font-medium">{title}</p>
      {examples && examples.length > 0 && (
        <ul
          className="flex flex-col gap-2 text-sm text-muted-foreground"
          aria-label="Example prompts"
        >
          {examples.map((ex) => (
            <li key={ex}>
              <span className="text-foreground/70">Try:</span> {ex}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
