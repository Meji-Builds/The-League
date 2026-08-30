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

export async function confirmResult(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();

  const fixtureId = formData.get("fixture_id") as string;
  const scoreA    = parseInt(formData.get("score_a") as string, 10);
  const scoreB    = parseInt(formData.get("score_b") as string, 10);
  const clubAId   = formData.get("club_a_id") as string;
  const clubBId   = formData.get("club_b_id") as string;

  if (!fixtureId || isNaN(scoreA) || isNaN(scoreB)) return { error: "Invalid data." };

  const winnerId = scoreA > scoreB ? clubAId : scoreB > scoreA ? clubBId : null;

  const { error } = await db.from("fixtures").update({
    status: "confirmed",
    confirmed_score: { score_a: scoreA, score_b: scoreB },
    winner_club_id: winnerId,
  }).eq("id", fixtureId);

  if (error) { console.error("admin/confirmResult:", error); return { error: "Could not confirm result." }; }

  revalidatePath("/admin/results");
  revalidatePath("/admin/disputes");
  revalidatePath("/fixtures");
  revalidatePath("/");
  return null;
}

export async function markDisputed(formData: FormData): Promise<void> {
  const db = await requireAdminDb();
  // DeleteButton sends the id as "id"
  const fixtureId = (formData.get("id") ?? formData.get("fixture_id")) as string;
  await db.from("fixtures").update({ status: "disputed" }).eq("id", fixtureId);
  revalidatePath("/admin/results");
  revalidatePath("/admin/disputes");
}
