"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createBrandKit, deleteBrandKit } from "@/lib/db/brand-kits";

export async function createBrandKitAction(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  await createBrandKit(user.userId, {
    name,
    primary_color: (formData.get("primary_color") as string) || null,
    accent_color: (formData.get("accent_color") as string) || null,
    font_family: (formData.get("font_family") as string) || null,
    logo_url: (formData.get("logo_url") as string) || null,
  });

  revalidatePath("/brand-kits");
}

export async function deleteBrandKitAction(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");
  await deleteBrandKit(user.userId, id);
  revalidatePath("/brand-kits");
}
