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
  revalidatePath("/fixtures");
  revalidatePath("/");
  return null;
}

export async function updateFixture(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();

  const fixtureId     = formData.get("fixture_id") as string;
  const competitionId = formData.get("competition_id") as string;
  const clubAId       = formData.get("club_a_id") as string;
  const clubBId       = formData.get("club_b_id") as string;
  const stage         = formData.get("stage") as string;
  const groupName     = (formData.get("group_name") as string)?.trim() || "Open";
  const matchday      = parseInt(formData.get("matchday") as string, 10) || 1;
  const scheduledAt   = (formData.get("scheduled_at") as string) || null;
  const status        = formData.get("status") as string;

  if (!fixtureId) return { error: "Invalid fixture." };
  if (clubAId && clubBId && clubAId === clubBId) return { error: "A club cannot play against itself." };

  const { error } = await db
    .from("fixtures")
    .update({
      ...(competitionId && { competition_id: competitionId }),
      ...(clubAId       && { club_a_id: clubAId }),
      ...(clubBId       && { club_b_id: clubBId }),
      stage,
      group_name: groupName,
      matchday,
      scheduled_at: scheduledAt,
      ...(status && { status }),
    })
    .eq("id", fixtureId);

  if (error) {
    console.error("admin/updateFixture:", error);
    return { error: "Could not update fixture. Please try again." };
  }

  revalidatePath("/admin/fixtures");
  revalidatePath("/fixtures");
  revalidatePath("/");
  return null;
}

export async function deleteFixture(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();

  const fixtureId = formData.get("fixture_id") as string;
  if (!fixtureId) return { error: "Invalid fixture." };

  const { error } = await db.from("fixtures").delete().eq("id", fixtureId);
  if (error) {
    console.error("admin/deleteFixture:", error);
    return { error: "Could not delete fixture. Please try again." };
  }

  revalidatePath("/admin/fixtures");
  revalidatePath("/fixtures");
  revalidatePath("/");
  return null;
}

export async function uploadLineupImages(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();

  const fixtureId = formData.get("fixture_id") as string;
  if (!fixtureId) return { error: "Invalid fixture." };

  const urlA = (formData.get("lineup_image_a_url") as string) || null;
  const urlB = (formData.get("lineup_image_b_url") as string) || null;

  const updates: Record<string, string> = {};
  if (urlA) updates.lineup_image_a = urlA;
  if (urlB) updates.lineup_image_b = urlB;

  if (Object.keys(updates).length === 0) return { error: "Please select at least one image." };

  const { error } = await db.from("fixtures").update(updates).eq("id", fixtureId);
  if (error) { console.error("admin/uploadLineupImages:", error); return { error: "Could not save lineup images." }; }

  revalidatePath("/admin/fixtures");
  revalidatePath(`/fixtures/${fixtureId}`);
  return null;
}
