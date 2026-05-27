import { CoinsIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatNumber } from "@/lib/utils";

export function CreditMeter({
  credits,
  className,
}: {
  credits: number;
  className?: string;
}) {
  const low = credits < 25;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border border-foreground/10 bg-card px-3 py-1.5 text-xs",
            low &&
              "border-destructive/40 bg-destructive/5 text-destructive",
            className
          )}
        >
          <CoinsIcon
            className={cn(
              "size-3.5",
              low ? "text-destructive" : "text-primary"
            )}
          />
          <span className="font-medium tabular-nums">
            {formatNumber(credits)}
          </span>
          <span className="text-muted-foreground">credits</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {low
          ? "Low balance — top up in Billing."
          : "Credits remaining this period."}
      </TooltipContent>
    </Tooltip>
  );
}
