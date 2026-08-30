"use server";

import { createClient } from "@/lib/supabase/server";
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
  return { db, club };
}

export async function updateClubProfile(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { db, club } = await getClub();

  const name     = (formData.get("name")      as string)?.trim();
  const faculty  = (formData.get("faculty")   as string)?.trim();
  const bio      = (formData.get("bio")       as string)?.trim() || null;
  const logo_url = (formData.get("logo_url")  as string) || null;
  const badge_url= (formData.get("badge_url") as string) || null;

  if (!name || !faculty) return { error: "Club name and faculty are required." };

  const updates: Record<string, unknown> = { name, faculty, bio };
  if (logo_url)  { updates.logo_url = logo_url; updates.logo_status = "pending"; }
  if (badge_url) updates.badge_url = badge_url;

  const { error } = await db.from("clubs").update(updates).eq("id", club.id);
  if (error) {
    console.error("dashboard/updateClubProfile:", error);
    return { error: "Could not save profile. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}
