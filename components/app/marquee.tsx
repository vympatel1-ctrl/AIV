import { cn } from "@/lib/utils";

/**
 * Edge-faded infinite-scroll strip.
 *
 * Inspired by react-bits' marquee pattern but kept dependency-free — uses
 * the CSS keyframe defined in globals.css under `.animate-marquee`. Each
 * child is rendered twice so the scroll loops seamlessly.
 *
 * Use for "trusted by", "platforms", "models" strips on the marketing
 * surface. Editorial style is restrained, so we cap motion to one of these
 * per page.
 */
export function Marquee({
  children,
  pauseOnHover = true,
  className,
}: {
  children: React.ReactNode;
  pauseOnHover?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]",
        className
      )}
    >
      <div
        className={cn(
          "flex w-max items-center gap-12 animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        aria-hidden={false}
      >
        <div className="flex shrink-0 items-center gap-12">{children}</div>
        <div className="flex shrink-0 items-center gap-12" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
