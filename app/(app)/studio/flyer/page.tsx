import { PrinterIcon } from "lucide-react";

import { FlyerForm } from "@/components/app/studio/flyer-form";
import { StudioShell } from "@/components/app/studio-shell";

export default async function FlyerStudioPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <StudioShell
      title="Flyer Studio"
      description="Business cards and flyers from a prompt — with your logo, colors, and fonts baked in."
      icon={PrinterIcon}
    >
      <FlyerForm projectId={sp.projectId ?? null} />
    </StudioShell>
  );
}
