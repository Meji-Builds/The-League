"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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

export async function approveClubLogo(formData: FormData) {
  const db = await requireAdminDb();
  const clubId = formData.get("club_id") as string;
  await db.from("clubs").update({ logo_status: "approved" }).eq("id", clubId);
  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
}

export async function rejectClubLogo(formData: FormData) {
  const db = await requireAdminDb();
  const clubId = formData.get("club_id") as string;
  await db.from("clubs").update({ logo_status: "rejected", logo_url: null }).eq("id", clubId);
  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
}

export async function approvePlayerPhoto(formData: FormData) {
  const db = await requireAdminDb();
  const playerId = formData.get("player_id") as string;
  await db.from("players").update({ profile_picture_status: "approved" }).eq("id", playerId);
  revalidatePath("/admin/clubs");
}

export async function rejectPlayerPhoto(formData: FormData) {
  const db = await requireAdminDb();
  const playerId = formData.get("player_id") as string;
  await db.from("players").update({ profile_picture_status: "rejected", profile_picture_url: null }).eq("id", playerId);
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

async function hardDeleteClub(clubId: string, serviceDb: ReturnType<typeof createServiceClient>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = serviceDb as any;

  // Fetch owner user_id before deleting
  const { data: ownerRow } = await db
    .from("club_owners")
    .select("user_id")
    .eq("club_id", clubId)
    .single();

  // Fetch competition entries to delete fixtures
  const { data: entries } = await db
    .from("competition_entries")
    .select("id")
    .eq("club_id", clubId);

  const entryIds = (entries ?? []).map((e: { id: string }) => e.id);

  if (entryIds.length > 0) {
    // Delete fixtures that involve these entries (home or away)
    await db.from("fixtures")
      .delete()
      .or(`home_entry_id.in.(${entryIds.join(",")}),away_entry_id.in.(${entryIds.join(",")})`);
    await db.from("competition_entries").delete().in("id", entryIds);
  }

  // Delete payments
  await db.from("payments").delete().eq("club_id", clubId);
  // Delete club_owners (also removes the auth user link)
  await db.from("club_owners").delete().eq("club_id", clubId);
  // Delete players (club_id FK — cascades or explicit delete)
  await db.from("players").delete().eq("club_id", clubId);
  // Delete the club
  await db.from("clubs").delete().eq("id", clubId);

  // Delete the auth user if we have their id
  if (ownerRow?.user_id) {
    try {
      await serviceDb.auth.admin.deleteUser(ownerRow.user_id);
    } catch {
      // Swallow — user may already be gone
    }
  }
}

export async function approveTestClub(formData: FormData) {
  const db = await requireAdminDb();
  const clubId   = formData.get("club_id") as string;
  const inviteId = formData.get("invite_id") as string | null;

  await db.from("clubs").update({ status: "approved", is_test: false }).eq("id", clubId);

  if (inviteId) {
    await db.from("registration_invites").update({ status: "approved" }).eq("id", inviteId);
  }

  revalidatePath("/admin/clubs");
  revalidatePath("/admin/invites");
}

export async function rejectTestClub(formData: FormData) {
  const db      = await requireAdminDb();
  const clubId   = formData.get("club_id") as string;
  const inviteId = formData.get("invite_id") as string | null;

  const serviceDb = createServiceClient();

  await hardDeleteClub(clubId, serviceDb);

  if (inviteId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceDb as any).from("registration_invites").update({ status: "rejected" }).eq("id", inviteId);
  }

  void db; // requireAdminDb is still needed for the admin guard
  revalidatePath("/admin/clubs");
  revalidatePath("/admin/invites");
}

export async function deleteAllTestData(_formData: FormData) {
  await requireAdminDb();
  const serviceDb = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = serviceDb as any;

  const { data: testClubs } = await db
    .from("clubs")
    .select("id")
    .eq("is_test", true);

  for (const club of (testClubs ?? [])) {
    await hardDeleteClub(club.id, serviceDb);
  }

  revalidatePath("/admin/clubs");
  revalidatePath("/admin/invites");
}
