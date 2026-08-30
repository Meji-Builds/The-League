"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type ActionState = { error: string } | null;

async function getOwnerContext() {
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

  return { supabase, db, clubId: owner?.club_id as string | null };
}

export async function addPlayer(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, db, clubId } = await getOwnerContext();
  if (!clubId) return { error: "No club found. Please complete onboarding first." };

  const gamerTag = (formData.get("gamer_tag") as string)?.trim();
  const fullName = (formData.get("full_name") as string)?.trim() || null;
  const position = (formData.get("position") as string)?.trim() || null;
  const idCardFile = formData.get("id_card") as File | null;

  if (!gamerTag) return { error: "Gamer tag is required." };
  if (!idCardFile || idCardFile.size === 0) return { error: "Student ID card image is required." };

  // Upload the ID card image to Supabase Storage.
  const ext = idCardFile.name.split(".").pop() ?? "jpg";
  const storagePath = `${clubId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("id-cards")
    .upload(storagePath, idCardFile, { contentType: idCardFile.type, upsert: false });

  if (uploadError) {
    console.error("roster/addPlayer: storage upload failed", uploadError);
    return { error: "Could not upload ID card image. Please try again." };
  }

  const { data: { publicUrl } } = supabase.storage.from("id-cards").getPublicUrl(storagePath);

  const { error } = await db.from("players").insert({
    club_id: clubId,
    gamer_tag: gamerTag,
    full_name: fullName,
    position,
    id_card_url: publicUrl,
    id_card_status: "pending",
    stats: { matches_played: 0, wins: 0, losses: 0 },
  });

  if (error) {
    // Clean up the uploaded file if the DB insert fails.
    await supabase.storage.from("id-cards").remove([storagePath]);
    if (error.code === "23505") return { error: "A player with that gamer tag already exists in your roster." };
    console.error("roster/addPlayer:", error);
    return { error: "Could not add player. Please try again." };
  }

  revalidatePath("/dashboard/roster");
  return null;
}

export async function removePlayer(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { db, clubId } = await getOwnerContext();
  if (!clubId) return { error: "No club found." };

  const playerId = formData.get("player_id") as string;
  if (!playerId) return { error: "Invalid player." };

  const { error } = await db
    .from("players")
    .delete()
    .eq("id", playerId)
    .eq("club_id", clubId);

  if (error) {
    console.error("roster/removePlayer:", error);
    return { error: "Could not remove player. Please try again." };
  }

  revalidatePath("/dashboard/roster");
  return null;
}
