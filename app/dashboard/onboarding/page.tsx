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

  const { data: owner } = await db
    .from("club_owners")
    .select("id, owner_registration_payment_status, club:clubs(id, name)")
    .eq("user_id", user.id)
    .single();

  if (owner?.owner_registration_payment_status === "paid" && owner.club) {
    redirect("/dashboard");
  }

  const { data: feeRow } = await db
    .from("fee_settings")
    .select("owner_registration_fee")
    .limit(1)
    .single();
  const feeNaira: number = feeRow?.owner_registration_fee ?? 5000;

  const { step } = await searchParams;

  if (step === "3" || (owner?.owner_registration_payment_status === "paid")) {
    return <PendingStep clubName={owner?.club?.name} />;
  }

  if (!owner || step === "1") {
    return <ClubSetupStep />;
  }

  // Free registration — mark as paid and advance without showing Paystack UI.
  if (feeNaira === 0 && owner.owner_registration_payment_status !== "paid") {
    await db
      .from("club_owners")
      .update({ owner_registration_payment_status: "paid" })
      .eq("user_id", user.id);
    redirect("/dashboard/onboarding?step=3");
  }

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
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Onboarding</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">
          {clubName ? `${clubName}` : "Registration submitted"}
        </h1>
      </div>

      <div className="border border-success/20 border-l-[3px] border-l-success bg-card px-5 py-4 mb-8">
        <p className="font-medium text-white text-sm">
          {clubName ? `${clubName} is pending approval` : "Registration submitted"}
        </p>
        <p className="text-white/40 text-[13px] mt-1 leading-relaxed">
          Your payment is being verified and your club registration is under review by
          The League Office. You will be notified once your club is approved and live.
        </p>
      </div>

      <div className="border border-white/6 bg-card p-5 mb-8">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Progress</p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-white text-sm">Club profile created</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-white text-sm">Payment submitted</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="text-white/40 text-sm">Awaiting League Office approval</span>
          </div>
        </div>
      </div>

      <a
        href="/dashboard"
        className="inline-block bg-gold text-navy font-bold text-sm px-6 py-2.5 rounded hover:bg-gold/90 transition-colors"
      >
        Go to dashboard
      </a>
    </div>
  );
}
