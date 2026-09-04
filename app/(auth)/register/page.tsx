import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { createServiceClient } from "@/lib/supabase/service";
import { RegisterForm } from "./RegisterForm";

interface InviteData {
  expectedName: string;
  expectedClubName: string;
}

interface Props {
  searchParams: Promise<{ invite?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const { invite: rawToken } = await searchParams;
  const token = rawToken?.trim() || null;

  const settings = await getSiteSettings();
  let accessGranted = settings.registration_enabled;
  let inviteData: InviteData | null = null;

  // Validate invite token if provided (overrides closed registration)
  if (token) {
    try {
      const serviceDb = createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (serviceDb as any)
        .from("registration_invites")
        .select("expected_name, expected_club_name")
        .eq("token", token)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .single();

      if (data) {
        inviteData = {
          expectedName: data.expected_name,
          expectedClubName: data.expected_club_name,
        };
        accessGranted = true;
      }
    } catch {
      // Service client not available or token invalid — fall through to access check
    }
  }

  if (!accessGranted) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 rounded-full">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 className="text-white font-bold text-xl mb-2">Registration is closed</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          Club registration isn&apos;t open right now. If you received an invite link,
          make sure you&apos;re using the exact URL from your message.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gold text-sm hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  return <RegisterForm token={token} inviteData={inviteData} />;
}
