import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { uploadToAssets } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

const ALLOWED_IMAGE = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const ALLOWED_VIDEO = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE.has(file.type);
  const isVideo = ALLOWED_VIDEO.has(file.type) || file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 415 }
    );
  }

  const cap = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > cap) {
    return NextResponse.json(
      {
        error: `File too large (max ${Math.round(cap / 1_000_000)} MB for ${
          isVideo ? "video" : "image"
        })`,
      },
      { status: 413 }
    );
  }

  const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "bin");
  const folder = isVideo ? "uploads/video" : "uploads";
  const path = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const arr = new Uint8Array(await file.arrayBuffer());
  const upload = await uploadToAssets({
    userId: user.userId,
    path,
    body: Buffer.from(arr),
    contentType: file.type || (isVideo ? "video/mp4" : "application/octet-stream"),
  });

  if (!upload) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    url: upload.publicUrl,
    kind: isVideo ? "video" : "image",
  });
}
