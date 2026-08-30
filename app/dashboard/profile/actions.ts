"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadMedia } from "@/lib/supabase/upload-media";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type ActionState = { error: string } | { success: true } | null;

async function getClub() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: club } = await db
    .from("clubs")
    .select("id, logo_url, badge_url")
    .eq("owner_id", user.id)
    .single();

  if (!club) redirect("/dashboard/onboarding");
  return { supabase, db, club };
}

export async function updateClubProfile(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, db, club } = await getClub();

  const name      = (formData.get("name") as string)?.trim();
  const faculty   = (formData.get("faculty") as string)?.trim();
  const bio       = (formData.get("bio") as string)?.trim() || null;
  const logoFile  = formData.get("logo") as File | null;
  const badgeFile = formData.get("badge") as File | null;

  if (!name || !faculty) return { error: "Club name and faculty are required." };

  const updates: Record<string, unknown> = { name, faculty, bio };

  if (logoFile?.size) {
    const url = await uploadMedia(supabase, logoFile, club.id, "clubs");
    if (!url) return { error: "Could not upload logo. Please try again." };
    updates.logo_url = url;
  }

  if (badgeFile?.size) {
    const url = await uploadMedia(supabase, badgeFile, club.id, "clubs");
    if (!url) return { error: "Could not upload badge/cover. Please try again." };
    updates.badge_url = url;
  }

  const { error } = await db.from("clubs").update(updates).eq("id", club.id);
  if (error) {
    console.error("dashboard/updateClubProfile:", error);
    return { error: "Could not save profile. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}
