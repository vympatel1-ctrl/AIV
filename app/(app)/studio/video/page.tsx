import { PlayIcon } from "lucide-react";

import { VideoForm } from "@/components/app/studio/video-form";
import { StudioShell } from "@/components/app/studio-shell";
import { defaultVideoProviderName } from "@/lib/ai/video";

export default async function VideoStudioPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await props.searchParams;
  const defaultProvider = defaultVideoProviderName();
  return (
    <StudioShell
      title="Video Studio"
      description="Generate, then keep refining. Each tweak is saved as a new version you can revisit."
      icon={PlayIcon}
    >
      <VideoForm
        projectId={sp.projectId ?? null}
        defaultProvider={defaultProvider}
      />
    </StudioShell>
  );
}
