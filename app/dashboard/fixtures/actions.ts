"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadMedia } from "@/lib/supabase/upload-media";

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

  const fixtureId = formData.get("fixture_id") as string;
  if (!fixtureId) return { error: "Invalid fixture." };

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
  const file = formData.get("lineup_image") as File | null;

  if (!file || file.size === 0) return { error: "Please select an image to upload." };

  const url = await uploadMedia(supabase, file, `lineups/${fixtureId}`);
  if (!url) return { error: "Upload failed. Please try again." };

  const { error } = await db.from("fixtures").update({ [column]: url }).eq("id", fixtureId);
  if (error) {
    console.error("uploadClubLineup:", error);
    return { error: "Could not save lineup image. Please try again." };
  }

  revalidatePath("/dashboard/fixtures");
  revalidatePath(`/fixtures/${fixtureId}`);
  return null;
}
