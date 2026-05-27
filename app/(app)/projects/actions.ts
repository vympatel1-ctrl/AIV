"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/lib/db/projects";
import { deleteAsset } from "@/lib/db/assets";

export async function createProjectAction(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Project name is required");
  }
  const description = (formData.get("description") as string) || null;
  const category = (formData.get("category") as string) || null;

  const project = await createProject(user.userId, {
    name,
    description,
    category,
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing project id");
  const name = String(formData.get("name") ?? "").trim();
  const description = (formData.get("description") as string) || null;
  const category = (formData.get("category") as string) || null;

  await updateProject(user.userId, id, {
    name,
    description,
    category,
  });
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

export async function deleteProjectAction(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing project id");
  await deleteProject(user.userId, id);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/projects");
}

export async function deleteAssetAction(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!id) throw new Error("Missing asset id");
  await deleteAsset(user.userId, id);
  if (projectId) revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}
