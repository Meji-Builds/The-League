import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

// Supabase redirects here after a successful Google OAuth login or email confirmation.
// We exchange the code for a session, mark any invite as used, then redirect.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code   = searchParams.get("code");
  const next   = searchParams.get("next") ?? "/dashboard";
  const invite = searchParams.get("invite");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Mark the invite as used if a token was passed through the redirect.
      if (invite) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const serviceDb = createServiceClient();
            await (serviceDb as any) // eslint-disable-line @typescript-eslint/no-explicit-any
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
          // Service client not configured — skip
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
