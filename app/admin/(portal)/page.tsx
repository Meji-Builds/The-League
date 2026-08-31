import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

async function getAdminStats() {
  try {
    const supabase = await createClient();
    const [
      { count: pendingClubs },
      { count: disputedFixtures },
      { count: totalClubs },
      { count: totalPlayers },
      { count: pendingPayments },
    ] = await Promise.all([
      supabase.from("clubs").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("fixtures").select("*", { count: "exact", head: true }).eq("status", "disputed"),
      supabase.from("clubs").select("*", { count: "exact", head: true }),
      supabase.from("players").select("*", { count: "exact", head: true }),
      supabase.from("competition_entries").select("*", { count: "exact", head: true }).eq("payment_status", "unpaid"),
    ]);
    return { pendingClubs: pendingClubs ?? 0, disputedFixtures: disputedFixtures ?? 0, totalClubs: totalClubs ?? 0, totalPlayers: totalPlayers ?? 0, pendingPayments: pendingPayments ?? 0 };
  } catch {
    return { pendingClubs: 0, disputedFixtures: 0, totalClubs: 0, totalPlayers: 0, pendingPayments: 0 };
  }
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">League Office</h1>
      </div>

      {/* Action items */}
      {(stats.pendingClubs > 0 || stats.disputedFixtures > 0 || stats.pendingPayments > 0) && (
        <div className="mb-8">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Needs Attention</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {stats.pendingClubs > 0 && (
              <a
                href="/admin/clubs?filter=pending"
                className="flex items-center justify-between bg-card border border-warning/40 border-l-[3px] border-l-warning px-5 py-4 hover:bg-white/[0.03] transition-colors flex-1"
              >
                <div>
                  <p className="font-semibold text-white text-sm">Club approvals</p>
                  <p className="text-white/40 text-xs mt-0.5">{stats.pendingClubs} pending</p>
                </div>
                <span className="font-display font-black text-xl text-warning">{stats.pendingClubs}</span>
              </a>
            )}
            {stats.disputedFixtures > 0 && (
              <a
                href="/admin/disputes"
                className="flex items-center justify-between bg-card border border-danger/40 border-l-[3px] border-l-danger px-5 py-4 hover:bg-white/[0.03] transition-colors flex-1"
              >
                <div>
                  <p className="font-semibold text-white text-sm">Disputed results</p>
                  <p className="text-white/40 text-xs mt-0.5">{stats.disputedFixtures} to resolve</p>
                </div>
                <span className="font-display font-black text-xl text-danger">{stats.disputedFixtures}</span>
              </a>
            )}
            {stats.pendingPayments > 0 && (
              <a
                href="/admin/payments"
                className="flex items-center justify-between bg-card border border-warning/40 border-l-[3px] border-l-warning px-5 py-4 hover:bg-white/[0.03] transition-colors flex-1"
              >
                <div>
                  <p className="font-semibold text-white text-sm">Pending payments</p>
                  <p className="text-white/40 text-xs mt-0.5">{stats.pendingPayments} awaiting confirmation</p>
                </div>
                <span className="font-display font-black text-xl text-warning">{stats.pendingPayments}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 border border-white/5 mb-10">
        {[
          { label: "Total Clubs",   value: stats.totalClubs },
          { label: "Total Players", value: stats.totalPlayers },
          { label: "Pending",       value: stats.pendingClubs },
          { label: "Disputes",      value: stats.disputedFixtures },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card px-5 py-5 text-center">
            <p className="font-display font-black text-3xl text-white leading-none">{value}</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-dim mt-2">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Quick Access</p>
      <div className="border border-white/6 divide-y divide-white/5">
        {[
          { label: "Review Clubs",          href: "/admin/clubs",        desc: "Approve, reject, or suspend club registrations." },
          { label: "Manage Competitions",   href: "/admin/competitions", desc: "Create and configure competitions and entry fees." },
          { label: "Create Fixtures",       href: "/admin/fixtures",     desc: "Schedule matches for any competition." },
          { label: "Resolve Disputes",      href: "/admin/disputes",     desc: "Compare submitted proof and set the final score." },
          { label: "Settings",              href: "/admin/settings",     desc: "Set the owner registration fee and per-competition fees." },
        ].map(({ label, href, desc }) => (
          <a
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
          </a>
        ))}
      </div>
    </div>
  );
}
