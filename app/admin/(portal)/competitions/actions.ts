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

type ActionState = { error: string } | null;

export async function createCompetition(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();

  const name        = (formData.get("name") as string)?.trim();
  const type        = formData.get("type") as string;
  const format      = formData.get("format") as string;
  const cycle       = formData.get("cycle") as string;
  const edition     = (formData.get("edition") as string)?.trim();
  const entryFee    = parseFloat(formData.get("entry_fee") as string) || 0;
  const status      = formData.get("status") as string;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name || !type || !format || !cycle || !edition || !status) {
    return { error: "All required fields must be filled in." };
  }

  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data: conflict } = await db.from("competitions").select("id").eq("slug", baseSlug).single();
  const slug = conflict ? `${baseSlug}-${edition.toLowerCase().replace(/\s+/g, "-")}` : baseSlug;

  const { error } = await db.from("competitions").insert({
    name, slug, type, format, cycle, edition, entry_fee: entryFee, status, description,
  });

  if (error) {
    console.error("admin/createCompetition:", error);
    return { error: "Could not create competition. Please try again." };
  }

  revalidatePath("/admin/competitions");
  return null;
}

export async function updateCompetitionStatus(formData: FormData) {
  const db = await requireAdminDb();
  const competitionId = formData.get("competition_id") as string;
  const status = formData.get("status") as string;
  await db.from("competitions").update({ status }).eq("id", competitionId);
  revalidatePath("/admin/competitions");
}

export async function updateCompetitionBanner(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();
  const competitionId  = (formData.get("competition_id")  as string).trim();
  const bannerImageUrl = (formData.get("banner_image_url") as string).trim() || null;

  if (!competitionId) return { error: "Missing competition ID." };

  const { error } = await db
    .from("competitions")
    .update({ banner_image_url: bannerImageUrl })
    .eq("id", competitionId);

  if (error) {
    console.error("admin/updateCompetitionBanner:", error);
    return { error: "Could not save banner. Please try again." };
  }

  revalidatePath("/admin/competitions");
  revalidatePath("/competitions");
  return null;
}
