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

export async function createHighlight(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const title          = (formData.get("title")          as string).trim();
  const video_url      = (formData.get("video_url")      as string).trim();
  const thumbnail_url  = (formData.get("thumbnail_url")  as string).trim() || null;
  const competition_id = (formData.get("competition_id") as string).trim() || null;

  if (!title)     return { error: "Title is required." };
  if (!video_url) return { error: "Video URL is required." };

  const { error } = await db.from("highlights").insert({
    title,
    video_url,
    thumbnail_url,
    competition_id: competition_id || null,
    published_at:   new Date().toISOString(),
  });

  if (error) {
    console.error("admin/createHighlight:", error);
    return { error: "Could not save highlight. Please try again." };
  }

  revalidatePath("/highlights");
  revalidatePath("/admin/highlights");
  return { success: true };
}

export async function deleteHighlight(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("highlights").delete().eq("id", id);
  revalidatePath("/highlights");
  revalidatePath("/admin/highlights");
}
