"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/admin/login");
  return { supabase, user };
}

type ActionState = { error: string } | { success: true; inviteUrl?: string } | null;

export async function generateInvite(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();

  const expectedName      = (formData.get("expected_name") as string)?.trim();
  const expectedClubName  = (formData.get("expected_club_name") as string)?.trim();
  const expectedEmail     = (formData.get("expected_email") as string)?.trim() || null;
  const note              = (formData.get("note") as string)?.trim() || null;
  const expiryDays        = parseInt(formData.get("expiry_days") as string, 10) || 7;

  if (!expectedName || !expectedClubName) {
    return { error: "Expected name and club name are required." };
  }

  const token     = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

  const serviceDb = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = serviceDb as any;

  const { error } = await db.from("registration_invites").insert({
    token,
    expected_name:      expectedName,
    expected_club_name: expectedClubName,
    expected_email:     expectedEmail,
    note,
    created_by: user.id,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("admin/generateInvite:", error);
    return { error: "Could not create invite. Please try again." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/register?invite=${token}`;

  revalidatePath("/admin/invites");
  return { success: true, inviteUrl };
}

export async function revokeInvite(formData: FormData) {
  await requireAdmin();
  const inviteId  = formData.get("invite_id") as string;
  const serviceDb = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceDb as any)
    .from("registration_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("status", "pending");
  revalidatePath("/admin/invites");
}

export async function resetInvite(formData: FormData) {
  await requireAdmin();
  const inviteId  = formData.get("invite_id") as string;
  const serviceDb = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = serviceDb as any;

  const newToken   = randomBytes(32).toString("hex");
  const newExpiry  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await db.from("registration_invites").update({
    token:          newToken,
    status:         "pending",
    used_at:        null,
    used_by_user_id: null,
    expires_at:     newExpiry,
  }).eq("id", inviteId);

  revalidatePath("/admin/invites");
}
