"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  deleteAsset,
  getAsset,
  moveAssetToProject,
  renameAsset,
} from "@/lib/db/assets";
import { deleteFromAssets } from "@/lib/storage";

function isUuid(v: string | null | undefined): v is string {
  return Boolean(
    v &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        v
      )
  );
}

export async function renameAssetAction(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  if (!isUuid(id)) throw new Error("Invalid asset id");
  await renameAsset(user.userId, id, title);
  revalidatePath("/library");
  revalidatePath(`/library/${id}`);
}

export async function moveAssetAction(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  const rawProject = String(formData.get("project_id") ?? "");
  const projectId = rawProject === "" || rawProject === "none" ? null : rawProject;
  if (!isUuid(id)) throw new Error("Invalid asset id");
  if (projectId !== null && !isUuid(projectId))
    throw new Error("Invalid project id");
  await moveAssetToProject(user.userId, id, projectId);
  revalidatePath("/library");
  revalidatePath(`/library/${id}`);
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function deleteAssetAction(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) throw new Error("Invalid asset id");

  // If we re-hosted the file in our own bucket, delete the bytes too so we
  // don't leak storage. Provider-hosted URLs we just leave (they expire).
  const asset = await getAsset(user.userId, id);
  const meta = (asset?.metadata ?? null) as { storage_path?: string } | null;
  if (meta?.storage_path) {
    await deleteFromAssets(meta.storage_path).catch(() => false);
  }

  await deleteAsset(user.userId, id);
  revalidatePath("/library");
  redirect("/library");
}
