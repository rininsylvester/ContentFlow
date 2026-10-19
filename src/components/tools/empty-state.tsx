import { Sparkles } from "lucide-react";

/**
 * Empty state with example prompts. When `onSelectExample` is given (client
 * usage), examples render as buttons that fill the form.
 */
export function EmptyState({
  title,
  examples,
  onSelectExample,
}: {
  title: string;
  examples?: readonly string[];
  onSelectExample?: (example: string) => void;
}) {
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
              {onSelectExample ? (
                <button
                  type="button"
                  onClick={() => onSelectExample(ex)}
                  className="rounded-md px-2 py-1 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="text-foreground/70">Try:</span> {ex}
                </button>
              ) : (
                <>
                  <span className="text-foreground/70">Try:</span> {ex}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
