"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Mark an invite as used after the user has authenticated.
 * Called from the client after a successful signUp with immediate session,
 * or from the OAuth callback for Google sign-up.
 */
export async function markInviteUsed(token: string): Promise<void> {
  if (!token) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const serviceDb = createServiceClient();
    await serviceDb
      .from("registration_invites")
      .update({
        used_at: new Date().toISOString(),
        used_by_user_id: user.id,
        status: "used",
      })
      .eq("token", token)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString());
  } catch {
    // Service client not configured — skip silently
  }
}
