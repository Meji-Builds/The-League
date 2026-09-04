import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

// Supabase redirects here after a successful Google OAuth login or email confirmation.
// We exchange the code for a session, gate new users against closed registration, then redirect.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code   = searchParams.get("code");
  const next   = searchParams.get("next") ?? "/dashboard";
  const invite = searchParams.get("invite");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Admins always pass through regardless of registration state.
        const isAdmin = user.app_metadata?.role === "admin";

        if (!isAdmin) {
          try {
            const serviceDb = createServiceClient();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const db = serviceDb as any;

            // Check if this user already has a club (i.e. an existing member, not a new signup).
            const { data: ownerRecord } = await db
              .from("club_owners")
              .select("id")
              .eq("user_id", user.id)
              .maybeSingle();

            if (!ownerRecord) {
              // New user — check whether registration is currently open.
              const { data: settings } = await db
                .from("site_settings")
                .select("registration_enabled")
                .eq("id", 1)
                .single();

              const registrationOpen = settings?.registration_enabled ?? true;

              if (!registrationOpen && !invite) {
                // They bypassed /register (e.g. via the login page Google button).
                // Delete the newly-created auth user so they can't access anything.
                await serviceDb.auth.admin.deleteUser(user.id);
                return NextResponse.redirect(`${origin}/login?error=registration_closed`);
              }
            }

            // Mark the invite as used if a token was passed through the redirect.
            if (invite) {
              await db
                .from("registration_invites")
                .update({
                  used_at: new Date().toISOString(),
                  used_by_user_id: user.id,
                  status: "used",
                })
                .eq("token", invite)
                .eq("status", "pending")
                .gt("expires_at", new Date().toISOString());
            }
          } catch {
            // Service client not configured — skip gating
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
