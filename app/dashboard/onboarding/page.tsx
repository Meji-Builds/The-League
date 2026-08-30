import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClubSetupStep } from "./ClubSetupStep";
import { PaymentStep } from "./PaymentStep";

export const metadata = { title: "Club Onboarding" };

interface Props {
  searchParams: Promise<{ step?: string }>;
}

export default async function OnboardingPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Fetch the owner record and club in one query.
  const { data: owner } = await db
    .from("club_owners")
    .select("id, owner_registration_payment_status, club:clubs(id, name)")
    .eq("user_id", user.id)
    .single();

  // If fully onboarded, send to dashboard.
  if (owner?.owner_registration_payment_status === "paid" && owner.club) {
    redirect("/dashboard");
  }

  // Fetch the fee for display purposes.
  const { data: feeRow } = await db
    .from("fee_settings")
    .select("owner_registration_fee")
    .limit(1)
    .single();
  const feeNaira: number = feeRow?.owner_registration_fee ?? 5000;

  const { step } = await searchParams;

  // Determine which step to show.
  // Step 1: no owner record yet, or explicit step=1.
  // Step 2: owner exists but fee not paid, or explicit step=2.
  // Step 3: payment completed (returning from Paystack callback).
  if (step === "3" || (owner?.owner_registration_payment_status === "paid")) {
    return <PendingStep clubName={owner?.club?.name} />;
  }

  if (!owner || step === "1") {
    return <ClubSetupStep />;
  }

  // Owner exists but payment pending.
  return (
    <PaymentStep
      feeNaira={feeNaira}
      clubName={owner.club?.name ?? "your club"}
    />
  );
}

function PendingStep({ clubName }: { clubName?: string }) {
  return (
    <div className="max-w-lg">
      <div className="w-12 h-12 bg-success/10 border border-success/30 flex items-center justify-center mb-6 rounded">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D7A4F" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="text-navy text-xl font-bold mb-2">
        {clubName ? `${clubName} is pending approval` : "Registration submitted"}
      </h2>
      <p className="text-muted text-sm leading-relaxed mb-6">
        Your payment is being verified and your club registration is under review by
        The League Office. You will be notified once your club is approved and live.
      </p>

      <div className="border border-border bg-white rounded p-5 space-y-3 text-sm mb-6">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-navy">Club profile created</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-navy">Payment submitted</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-muted/20 border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-muted/50" />
          </div>
          <span className="text-muted">Awaiting League Office approval</span>
        </div>
      </div>

      <a
        href="/dashboard"
        className="inline-block bg-gold text-navy font-semibold text-sm px-6 py-2.5 rounded hover:bg-gold/90 transition-colors"
      >
        Go to dashboard
      </a>
    </div>
  );
}
