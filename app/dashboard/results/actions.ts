"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type ActionState = { error: string } | null;

export async function submitResult(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fixtureId = formData.get("fixture_id") as string;
  const isClubA   = formData.get("is_club_a") === "true";
  const scoreOwn  = parseInt(formData.get("score_own") as string, 10);
  const scoreOpp  = parseInt(formData.get("score_opp") as string, 10);
  const proofUrl  = (formData.get("proof_url") as string)?.trim();

  if (isNaN(scoreOwn) || isNaN(scoreOpp) || scoreOwn < 0 || scoreOpp < 0) {
    return { error: "Please enter valid scores (0 or higher)." };
  }
  if (!proofUrl) return { error: "A proof URL is required (screenshot link)." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // score_a and score_b are always relative to club_a and club_b in the fixture row.
  const report = {
    score_a: isClubA ? scoreOwn : scoreOpp,
    score_b: isClubA ? scoreOpp : scoreOwn,
    proof_image_url: proofUrl,
    submitted_at: new Date().toISOString(),
  };

  const reportField = isClubA ? "reported_by_a" : "reported_by_b";

  const { data: fixture, error: updateError } = await db
    .from("fixtures")
    .update({ [reportField]: report, status: "reported" })
    .eq("id", fixtureId)
    .select("reported_by_a, reported_by_b")
    .single();

  if (updateError) {
    console.error("results/submitResult:", updateError);
    return { error: "Could not submit result. Please try again." };
  }

  // Auto-confirm if both sides reported the same score.
  const a = fixture.reported_by_a;
  const b = fixture.reported_by_b;
  if (a && b && a.score_a === b.score_a && a.score_b === b.score_b) {
    const winnerId = a.score_a > a.score_b
      ? (await db.from("fixtures").select("club_a_id").eq("id", fixtureId).single()).data?.club_a_id
      : a.score_b > a.score_a
      ? (await db.from("fixtures").select("club_b_id").eq("id", fixtureId).single()).data?.club_b_id
      : null;

    await db.from("fixtures").update({
      status: "confirmed",
      confirmed_score: { score_a: a.score_a, score_b: a.score_b },
      winner_club_id: winnerId,
    }).eq("id", fixtureId);
  }

  revalidatePath("/dashboard/results");
  revalidatePath("/dashboard/fixtures");
  return null;
}
