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

export async function setDivisionPromotions(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const db = await requireAdminDb();

  const divisionId = (formData.get("division_id") as string)?.trim();
  const season     = (formData.get("season")      as string)?.trim();
  const club1Id    = (formData.get("club1_id")    as string)?.trim();
  const club2Id    = (formData.get("club2_id")    as string)?.trim();

  if (!divisionId || !season) return { error: "Missing division or season." };
  if (!club1Id || !club2Id)   return { error: "Please select both clubs." };
  if (club1Id === club2Id)    return { error: "Both clubs must be different." };

  // Overwrite any existing promotions for this division + season
  await db.from("division_promotions").delete().eq("division_id", divisionId).eq("season", season);

  const { error } = await db.from("division_promotions").insert([
    { division_id: divisionId, club_id: club1Id, position: 1, season },
    { division_id: divisionId, club_id: club2Id, position: 2, season },
  ]);

  if (error) {
    console.error("setDivisionPromotions:", error);
    return { error: "Could not save promotions. " + error.message };
  }

  revalidatePath("/admin/championship");
  revalidatePath("/championship");
  return null;
}
