"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdminDb() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") throw new Error("Unauthorized");
  return supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

type ActionState = { error: string } | null;

export async function createFixture(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();

  const competitionId = formData.get("competition_id") as string;
  const clubAId       = formData.get("club_a_id") as string;
  const clubBId       = formData.get("club_b_id") as string;
  const stage         = formData.get("stage") as string;
  const groupName     = (formData.get("group_name") as string)?.trim() || "Open";
  const matchday      = parseInt(formData.get("matchday") as string, 10) || 1;
  const scheduledAt   = (formData.get("scheduled_at") as string) || null;

  if (!competitionId || !clubAId || !clubBId || !stage) {
    return { error: "Competition, both clubs, and stage are required." };
  }

  if (clubAId === clubBId) {
    return { error: "A club cannot play against itself." };
  }

  const { error } = await db.from("fixtures").insert({
    competition_id: competitionId,
    club_a_id: clubAId,
    club_b_id: clubBId,
    stage,
    group_name: groupName,
    matchday,
    scheduled_at: scheduledAt,
    status: "scheduled",
  });

  if (error) {
    console.error("admin/createFixture:", error);
    return { error: "Could not create fixture. Please try again." };
  }

  revalidatePath("/admin/fixtures");
  return null;
}
