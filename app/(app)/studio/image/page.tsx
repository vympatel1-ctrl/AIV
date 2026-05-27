import { ImageIcon } from "lucide-react";

import { ImageForm } from "@/components/app/studio/image-form";
import { StudioShell } from "@/components/app/studio-shell";

export default async function ImageStudioPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <StudioShell
      title="Image Studio"
      description="Product ads, lifestyle scenes, thumbnails, and banners — at any aspect ratio."
      icon={ImageIcon}
    >
      <ImageForm projectId={sp.projectId ?? null} />
    </StudioShell>
  );
}
