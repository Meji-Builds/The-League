"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdminDb() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/admin/login");
  return supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function approveClubPost(formData: FormData): Promise<void> {
  const db = await requireAdminDb();
  const id = formData.get("id") as string;
  await db.from("club_posts").update({
    status: "approved",
    published_at: new Date().toISOString(),
  }).eq("id", id);
  revalidatePath("/admin/club-posts");
  revalidatePath("/news");
}

export async function rejectClubPost(formData: FormData): Promise<void> {
  const db = await requireAdminDb();
  const id = formData.get("id") as string;
  await db.from("club_posts").update({ status: "rejected" }).eq("id", id);
  revalidatePath("/admin/club-posts");
}

export async function deleteClubPostAdmin(formData: FormData): Promise<void> {
  const db = await requireAdminDb();
  const id = formData.get("id") as string;
  await db.from("club_posts").delete().eq("id", id);
  revalidatePath("/admin/club-posts");
  revalidatePath("/news");
}
