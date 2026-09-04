import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [{ data: rawOwner }, { data: feeRow }] = await Promise.all([
    db.from("club_owners").select("*, club:clubs(*)").eq("user_id", user.id).single(),
    db.from("fee_settings").select("owner_registration_fee").eq("id", 1).single(),
  ]);

  if (!rawOwner) redirect("/dashboard/onboarding");

  const owner = rawOwner as unknown as {
    owner_registration_payment_status: "unpaid" | "paid";
    club: { name: string; department: string; faculty: string; status: string } | null;
  };

  const feeNaira = feeRow?.owner_registration_fee ?? 0;
  const feeIsFree = feeNaira === 0;

  const club = owner.club;

  return (
    <div>
      <div className="mb-10">
        {club && (
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-cobalt mb-3">{club.faculty}</p>
        )}
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">
          {club ? club.name : "Club Dashboard"}
        </h1>
        {club?.department && (
          <p className="text-white/30 text-[13px] mt-2">{club.department}</p>
        )}
      </div>

      {/* Status banner */}
      {club?.status === "pending" && (
        <div className="border border-warning/40 border-l-[3px] border-l-warning bg-card px-5 py-4 mb-8">
          <p className="font-semibold text-white text-sm">Your club is pending approval.</p>
          <p className="text-white/40 text-[13px] mt-1">
            The League Office will review your registration and approve it shortly.
          </p>
        </div>
      )}

      {owner.owner_registration_payment_status === "unpaid" && !feeIsFree && (
        <div className="border border-danger/40 border-l-[3px] border-l-danger bg-card px-5 py-4 mb-8">
          <p className="font-semibold text-white text-sm">Registration fee not yet paid.</p>
          <p className="text-white/40 text-[13px] mt-1">Complete your registration fee payment to proceed.</p>
          <Link
            href="/dashboard/onboarding"
            className="mt-3 inline-block bg-gold text-navy font-bold text-xs px-4 py-2 rounded hover:bg-gold/90 transition-colors"
          >
            Complete payment
          </Link>
        </div>
      )}

      {/* Quick links */}
      <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Quick Access</p>
      <div className="border border-white/6 divide-y divide-white/5">
        {[
          { label: "Manage Roster",       href: "/dashboard/roster",       desc: "Add, edit, or remove players." },
          { label: "Enter a Competition", href: "/dashboard/competitions",  desc: "Browse open competitions and pay the entry fee." },
          { label: "My Fixtures",         href: "/dashboard/fixtures",      desc: "Upcoming and past matches." },
          { label: "Report a Result",     href: "/dashboard/results",       desc: "Submit match scores and proof." },
        ].map(({ label, href, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors group"
          >
            <div>
              <p className="font-medium text-[13px] text-white/80 group-hover:text-white transition-colors">{label}</p>
              <p className="text-white/30 text-xs mt-0.5">{desc}</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
