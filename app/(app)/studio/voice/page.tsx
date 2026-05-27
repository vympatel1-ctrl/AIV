import { MicIcon } from "lucide-react";

import { VoiceForm } from "@/components/app/studio/voice-form";
import { StudioShell } from "@/components/app/studio-shell";

export default async function VoiceStudioPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <StudioShell
      title="Voice Studio"
      description="Turn scripts and captions into studio-quality voiceovers with ElevenLabs."
      icon={MicIcon}
    >
      <VoiceForm projectId={sp.projectId ?? null} />
    </StudioShell>
  );
}
