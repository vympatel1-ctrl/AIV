import { cn } from "@/lib/utils";

export function StudioShell({
  title,
  description,
  icon: Icon,
  children,
  rightSlot,
  className,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex max-w-6xl flex-col gap-8", className)}>
      <div className="flex flex-col gap-4 border-b border-foreground/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-5">
          <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground editorial-shadow">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Studio
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}
