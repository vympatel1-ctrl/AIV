import { PlayIcon } from "lucide-react";

import { VideoForm } from "@/components/app/studio/video-form";
import { StudioShell } from "@/components/app/studio-shell";

export default async function VideoStudioPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <StudioShell
      title="Video Studio"
      description="Animate product images or generate vertical short-form videos. Provider-agnostic."
      icon={PlayIcon}
    >
      <VideoForm projectId={sp.projectId ?? null} />
    </StudioShell>
  );
}
