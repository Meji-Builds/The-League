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
export type GenerateState = { success: true; count: number } | { error: string } | null;

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

export async function generateChampionshipFixtures(
  _prevState: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const db = await requireAdminDb();

  const season      = (formData.get("season")       as string)?.trim();
  const compId      = (formData.get("competition_id") as string)?.trim();
  const format      = (formData.get("format")        as string)?.trim();
  const numGroups   = Math.max(2, parseInt(formData.get("num_groups") as string) || 2);

  if (!season || !compId || !format) return { error: "Missing required fields." };

  // Load all promoted teams for this season ordered by division then position
  const { data: promoData, error: promoErr } = await db
    .from("division_promotions")
    .select("club_id, position, division_id")
    .eq("season", season)
    .order("division_id")
    .order("position");

  if (promoErr) return { error: "Could not load promotions." };
  if (!promoData || promoData.length < 2) return { error: "Need at least 2 promoted teams to generate fixtures." };

  // Seed order: all 1st-place first, then 2nd-place
  const pos1  = (promoData as { club_id: string; position: number }[]).filter((p) => p.position === 1).map((p) => p.club_id);
  const pos2  = (promoData as { club_id: string; position: number }[]).filter((p) => p.position === 2).map((p) => p.club_id);
  const teams = [...pos1, ...pos2];
  const n     = teams.length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];

  if (format === "roundrobin") {
    let md = 1;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        rows.push({ competition_id: compId, club_a_id: teams[i], club_b_id: teams[j], stage: "Group", group_name: "Championship", matchday: md++, status: "scheduled" });
      }
    }

  } else if (format === "knockout") {
    const stageName = n <= 2 ? "Final" : n <= 4 ? "Semi-final" : n <= 8 ? "Quarter-final" : "Round of 16";
    let md = 1;
    for (let i = 0; i < Math.floor(n / 2); i++) {
      rows.push({ competition_id: compId, club_a_id: teams[i], club_b_id: teams[n - 1 - i], stage: stageName, group_name: "Championship", matchday: md++, status: "scheduled" });
    }

  } else if (format === "groups") {
    const letters = "ABCDEFGH";
    const groupSize = Math.ceil(n / numGroups);
    let md = 1;
    for (let g = 0; g < numGroups; g++) {
      const slice = teams.slice(g * groupSize, (g + 1) * groupSize);
      const groupName = `Group ${letters[g]}`;
      for (let i = 0; i < slice.length; i++) {
        for (let j = i + 1; j < slice.length; j++) {
          rows.push({ competition_id: compId, club_a_id: slice[i], club_b_id: slice[j], stage: "Group", group_name: groupName, matchday: md++, status: "scheduled" });
        }
      }
    }
  } else {
    return { error: "Unknown format." };
  }

  if (rows.length === 0) return { error: "No fixtures to generate." };

  const { error: insertErr } = await db.from("fixtures").insert(rows);
  if (insertErr) {
    console.error("generateChampionshipFixtures:", insertErr);
    return { error: "Could not create fixtures: " + insertErr.message };
  }

  revalidatePath("/admin/fixtures");
  revalidatePath("/fixtures");
  revalidatePath("/");
  return { success: true, count: rows.length };
}
