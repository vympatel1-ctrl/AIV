import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { uploadToAssets } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 12 MB)" },
      { status: 413 }
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 415 }
    );
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const arr = new Uint8Array(await file.arrayBuffer());
  const upload = await uploadToAssets({
    userId: user.userId,
    path,
    body: Buffer.from(arr),
    contentType: file.type,
  });

  if (!upload) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, url: upload.publicUrl });
}
