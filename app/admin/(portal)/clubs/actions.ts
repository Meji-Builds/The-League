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

export async function approveClub(formData: FormData) {
  const db = await requireAdminDb();
  const clubId = formData.get("club_id") as string;
  await db.from("clubs").update({ status: "approved" }).eq("id", clubId);
  revalidatePath("/admin/clubs");
}

export async function suspendClub(formData: FormData) {
  const db = await requireAdminDb();
  const clubId = formData.get("club_id") as string;
  await db.from("clubs").update({ status: "suspended" }).eq("id", clubId);
  revalidatePath("/admin/clubs");
}

export async function approvePlayer(formData: FormData) {
  const db = await requireAdminDb();
  const playerId = formData.get("player_id") as string;
  await db.from("players").update({ id_card_status: "approved" }).eq("id", playerId);
  revalidatePath("/admin/clubs");
}

export async function rejectPlayer(formData: FormData) {
  const db = await requireAdminDb();
  const playerId = formData.get("player_id") as string;
  await db.from("players").update({ id_card_status: "rejected" }).eq("id", playerId);
  revalidatePath("/admin/clubs");
}
