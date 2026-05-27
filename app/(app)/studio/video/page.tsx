import { PlayIcon } from "lucide-react";

import { VideoForm } from "@/components/app/studio/video-form";
import { StudioShell } from "@/components/app/studio-shell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { defaultVideoProviderName } from "@/lib/ai/video";
import { listBrandKits } from "@/lib/db/brand-kits";

export default async function VideoStudioPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await props.searchParams;
  const defaultProvider = defaultVideoProviderName();
  const user = await getCurrentUser();
  const brandKits = await listBrandKits(user.userId);
  const ingestEnabled = Boolean(process.env.VIDEO_INGEST_RESOLVER_URL);

  return (
    <StudioShell
      title="Video Studio"
      description="Generate, then keep refining. Each tweak is saved as a new version you can revisit."
      icon={PlayIcon}
    >
      <VideoForm
        projectId={sp.projectId ?? null}
        defaultProvider={defaultProvider}
        brandKits={brandKits.map((b) => ({
          id: b.id,
          name: b.name,
          primary_color: b.primary_color,
          accent_color: b.accent_color,
          font_family: b.font_family,
          logo_url: b.logo_url,
        }))}
        socialIngestEnabled={ingestEnabled}
      />
    </StudioShell>
  );
}
