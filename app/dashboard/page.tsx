import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch the owner record for this user, joined with their club
  const { data: rawOwner } = await supabase
    .from("club_owners")
    .select("*, club:clubs(*)")
    .eq("user_id", user.id)
    .single();

  // New user — no owner record yet. Send them through onboarding.
  if (!rawOwner) redirect("/dashboard/onboarding");

  const owner = rawOwner as unknown as {
    owner_registration_payment_status: "unpaid" | "paid";
    club: { name: string; department: string; faculty: string; status: string } | null;
  };

  const club = owner.club;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">
          {club ? club.name : "Club Dashboard"}
        </h1>
        {club && (
          <p className="text-muted text-sm mt-1">
            {club.department} &middot; {club.faculty}
          </p>
        )}
      </div>

      {/* Status banner */}
      {club?.status === "pending" && (
        <div className="border border-warning bg-warning/5 px-5 py-4 mb-8 text-sm">
          <p className="font-semibold text-navy">Your club is pending approval.</p>
          <p className="text-muted mt-1">
            The League Office will review your registration and approve it shortly.
            You will be notified once your club is live.
          </p>
        </div>
      )}

      {owner.owner_registration_payment_status === "unpaid" && (
        <div className="border border-danger bg-danger/5 px-5 py-4 mb-8 text-sm">
          <p className="font-semibold text-navy">Registration fee not yet paid.</p>
          <p className="text-muted mt-1">
            Complete your registration fee payment to proceed.
          </p>
          <Link
            href="/dashboard/onboarding"
            className="mt-3 inline-block bg-gold text-navy font-semibold text-xs px-4 py-2 hover:bg-gold/90 transition-colors"
          >
            Complete payment
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Manage Roster",       href: "/dashboard/roster",       desc: "Add, edit, or remove players." },
          { label: "Enter a Competition", href: "/dashboard/competitions",  desc: "Browse open competitions and pay the entry fee." },
          { label: "My Fixtures",         href: "/dashboard/fixtures",      desc: "Upcoming and past matches." },
          { label: "Report a Result",     href: "/dashboard/results",       desc: "Submit match scores and proof." },
        ].map(({ label, href, desc }) => (
          <Link
            key={href}
            href={href}
            className="block bg-white border border-border p-5 hover:border-cobalt transition-colors group"
          >
            <p className="font-semibold text-navy group-hover:text-cobalt transition-colors text-sm">
              {label}
            </p>
            <p className="text-muted text-xs mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
