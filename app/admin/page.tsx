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
    ] = await Promise.all([
      supabase.from("clubs").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("fixtures").select("*", { count: "exact", head: true }).eq("status", "disputed"),
      supabase.from("clubs").select("*", { count: "exact", head: true }),
      supabase.from("players").select("*", { count: "exact", head: true }),
    ]);
    return { pendingClubs: pendingClubs ?? 0, disputedFixtures: disputedFixtures ?? 0, totalClubs: totalClubs ?? 0, totalPlayers: totalPlayers ?? 0 };
  } catch {
    return { pendingClubs: 0, disputedFixtures: 0, totalClubs: 0, totalPlayers: 0 };
  }
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-8">League Office</h1>

      {/* Action items — these need attention */}
      {(stats.pendingClubs > 0 || stats.disputedFixtures > 0) && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
            Needs Attention
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            {stats.pendingClubs > 0 && (
              <a
                href="/admin/clubs?filter=pending"
                className="flex items-center justify-between bg-white border border-warning px-5 py-4 hover:border-navy transition-colors"
              >
                <div>
                  <p className="font-semibold text-navy text-sm">Club approvals</p>
                  <p className="text-muted text-xs mt-0.5">{stats.pendingClubs} pending</p>
                </div>
                <span className="text-warning font-bold text-lg">{stats.pendingClubs}</span>
              </a>
            )}
            {stats.disputedFixtures > 0 && (
              <a
                href="/admin/disputes"
                className="flex items-center justify-between bg-white border border-danger px-5 py-4 hover:border-navy transition-colors"
              >
                <div>
                  <p className="font-semibold text-navy text-sm">Disputed results</p>
                  <p className="text-muted text-xs mt-0.5">{stats.disputedFixtures} to resolve</p>
                </div>
                <span className="text-danger font-bold text-lg">{stats.disputedFixtures}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Clubs",   value: stats.totalClubs },
          { label: "Total Players", value: stats.totalPlayers },
          { label: "Pending",       value: stats.pendingClubs },
          { label: "Disputes",      value: stats.disputedFixtures },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-border px-5 py-4">
            <p className="text-2xl font-bold text-navy">{value}</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Admin quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Review Clubs",          href: "/admin/clubs",        desc: "Approve, reject, or suspend club registrations." },
          { label: "Manage Competitions",   href: "/admin/competitions", desc: "Create and configure competitions and entry fees." },
          { label: "Create Fixtures",       href: "/admin/fixtures",     desc: "Schedule matches for any competition." },
          { label: "Resolve Disputes",      href: "/admin/disputes",     desc: "Compare submitted proof and set the final score." },
          { label: "Fee Settings",          href: "/admin/settings",     desc: "Set the owner registration fee and per-competition fees." },
        ].map(({ label, href, desc }) => (
          <a
            key={href}
            href={href}
            className="block bg-white border border-border p-5 hover:border-cobalt transition-colors group"
          >
            <p className="font-semibold text-navy group-hover:text-cobalt transition-colors text-sm">{label}</p>
            <p className="text-muted text-xs mt-1">{desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
