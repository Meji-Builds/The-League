"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/admin/login");
  return supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

type ActionState = { error: string } | { success: true } | null;

export async function createLivestream(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdmin();

  const url   = (formData.get("url")   as string).trim();
  const title = (formData.get("title") as string).trim() || "Live Now";

  if (!url) return { error: "Stream URL is required." };

  const { error } = await db.from("livestreams").insert({ url, title, is_active: true });
  if (error) {
    console.error("admin/createLivestream:", error);
    return { error: "Could not add stream. Please try again." };
  }

  revalidatePath("/admin/livestreams");
  revalidatePath("/");
  return { success: true };
}

export async function deleteLivestream(formData: FormData): Promise<void> {
  const db = await requireAdmin();
  const id = formData.get("id") as string;
  await db.from("livestreams").delete().eq("id", id);
  revalidatePath("/admin/livestreams");
  revalidatePath("/");
}
