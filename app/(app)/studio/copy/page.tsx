import { PenLineIcon } from "lucide-react";

import { CopyForm } from "@/components/app/studio/copy-form";
import { StudioShell } from "@/components/app/studio-shell";

export default async function CopyStudioPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <StudioShell
      title="Copy Studio"
      description="Hooks, captions, headlines, CTAs, and scripts. Tuned per platform."
      icon={PenLineIcon}
    >
      <CopyForm projectId={sp.projectId ?? null} />
    </StudioShell>
  );
}
