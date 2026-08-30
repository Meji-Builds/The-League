"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdminDb() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/admin/login");
  return supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

type ActionState = { error: string } | { success: true } | null;

export async function updateClubBanner(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();
  const clubId        = (formData.get("club_id")          as string).trim();
  const bannerImageUrl = (formData.get("banner_image_url") as string).trim() || null;

  if (!clubId) return { error: "Missing club ID." };

  const { error } = await db
    .from("clubs")
    .update({ banner_image_url: bannerImageUrl })
    .eq("id", clubId);

  if (error) {
    console.error("admin/updateClubBanner:", error);
    return { error: "Could not save banner. Please try again." };
  }

  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
  return { success: true };
}
