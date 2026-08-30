"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") throw new Error("Unauthorized");
  return { supabase, user };
}

type ActionState = { error: string } | { success: true } | null;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function createAnnouncement(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const title     = (formData.get("title")     as string).trim();
  const body      = (formData.get("body")      as string).trim();
  const image_url = (formData.get("image_url") as string).trim() || null;

  if (!title) return { error: "Title is required." };
  if (!body)  return { error: "Body is required." };

  const baseSlug = slugify(title);
  const slug     = `${baseSlug}-${Date.now().toString(36)}`;

  const { error } = await db.from("announcements").insert({
    title,
    slug,
    body,
    image_url,
    published_at:    new Date().toISOString(),
    author_admin_id: user.id,
  });

  if (error) {
    console.error("admin/createAnnouncement:", error);
    return { error: "Could not publish. Please try again." };
  }

  revalidatePath("/news");
  revalidatePath("/");
  revalidatePath("/admin/announcements");
  return { success: true };
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("announcements").delete().eq("id", id);
  revalidatePath("/news");
  revalidatePath("/");
  revalidatePath("/admin/announcements");
}
