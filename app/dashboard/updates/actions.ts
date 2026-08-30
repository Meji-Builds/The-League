"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type ActionState = { error: string } | { success: true } | null;

async function getOwnerClub() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: owner } = await db
    .from("club_owners")
    .select("club_id")
    .eq("user_id", user.id)
    .single();
  if (!owner?.club_id) redirect("/dashboard/onboarding");
  return { db, clubId: owner.club_id as string };
}

export async function createClubPost(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { db, clubId } = await getOwnerClub();

  const title    = (formData.get("title") as string)?.trim();
  const body     = (formData.get("body") as string)?.trim();
  const imageUrl = (formData.get("image_url") as string) || null;

  if (!title) return { error: "Title is required." };

  const { error } = await db.from("club_posts").insert({
    club_id:   clubId,
    title,
    body:      body || null,
    image_url: imageUrl,
    status:    "pending",
  });

  if (error) { console.error("createClubPost:", error); return { error: "Could not submit post." }; }

  revalidatePath("/dashboard/updates");
  return { success: true };
}

export async function deleteClubPost(formData: FormData): Promise<void> {
  const { db, clubId } = await getOwnerClub();
  const id = formData.get("id") as string;
  await db.from("club_posts").delete().eq("id", id).eq("club_id", clubId);
  revalidatePath("/dashboard/updates");
}
