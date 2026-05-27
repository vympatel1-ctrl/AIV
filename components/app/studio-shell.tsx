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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="inline-flex size-12 items-center justify-center rounded-xl gold-gradient luxury-glow text-primary-foreground">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Studio
            </p>
            <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
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
