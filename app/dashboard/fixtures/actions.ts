"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error: string } | null;

export async function uploadClubLineup(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: owner } = await db
    .from("club_owners")
    .select("club_id")
    .eq("user_id", user.id)
    .single();

  if (!owner?.club_id) return { error: "No club associated with your account." };

  const fixtureId      = formData.get("fixture_id") as string;
  const lineupImageUrl = formData.get("lineup_image_url") as string;

  if (!fixtureId) return { error: "Invalid fixture." };
  if (!lineupImageUrl) return { error: "No image URL provided." };

  const { data: fixture } = await db
    .from("fixtures")
    .select("id, club_a_id, club_b_id")
    .eq("id", fixtureId)
    .single();

  if (!fixture) return { error: "Fixture not found." };

  const isClubA = fixture.club_a_id === owner.club_id;
  const isClubB = fixture.club_b_id === owner.club_id;

  if (!isClubA && !isClubB) return { error: "Your club is not part of this fixture." };

  const column = isClubA ? "lineup_image_a" : "lineup_image_b";

  const { error } = await db.from("fixtures").update({ [column]: lineupImageUrl }).eq("id", fixtureId);
  if (error) {
    console.error("uploadClubLineup:", error);
    return { error: "Could not save lineup image. Please try again." };
  }

  revalidatePath("/dashboard/fixtures");
  revalidatePath(`/fixtures/${fixtureId}`);
  return null;
}
