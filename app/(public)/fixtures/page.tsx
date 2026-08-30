import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Fixtures" };

interface FixtureRow {
  id:              string;
  stage:           string;
  group_name:      string;
  matchday:        number;
  status:          string;
  scheduled_at:    string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a:          { id: string; name: string; slug: string; logo_url: string | null } | null;
  club_b:          { id: string; name: string; slug: string; logo_url: string | null } | null;
  competition:     { id: string; name: string; slug: string } | null;
}

async function getFixtures(): Promise<FixtureRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("fixtures")
      .select(`
        *,
        club_a:clubs!fixtures_club_a_id_fkey(id, name, slug, logo_url),
        club_b:clubs!fixtures_club_b_id_fkey(id, name, slug, logo_url),
        competition:competitions(id, name, slug)
      `)
      .order("scheduled_at", { ascending: true })
      .limit(50);
    return (data ?? []) as unknown as FixtureRow[];
  } catch {
    return [];
  }
}

const AVATAR_PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  reported:  "Reported",
  disputed:  "Disputed",
  confirmed: "Confirmed",
};

const statusPill: Record<string, string> = {
  scheduled: "bg-cobalt/10 text-cobalt",
  reported:  "bg-gold/10 text-gold",
  disputed:  "bg-danger/10 text-danger",
  confirmed: "bg-success/10 text-success",
};

export default async function FixturesPage() {
  const fixtures = await getFixtures();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-5 h-0.5 bg-gold shrink-0" />
          <p className="text-gold text-xs font-bold uppercase tracking-[0.25em]">Schedule</p>
        </div>
        <h1 className="font-display text-4xl font-bold text-white uppercase tracking-tight">Fixtures</h1>
        <p className="text-dim text-sm mt-1">All scheduled and completed matches.</p>
      </div>

      {fixtures.length === 0 ? (
        <div className="border border-rim bg-card px-8 py-14 text-center rounded">
          <p className="text-white font-semibold">No fixtures scheduled yet.</p>
          <p className="text-dim text-sm mt-2">Check back once the competition stage begins.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fixtures.map((f) => (
            <Link
              key={f.id}
              href={`/fixtures/${f.id}`}
              className="block bg-card border border-rim p-4 hover:border-cobalt/50 transition-all group rounded"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 mr-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold truncate">
                    {f.competition?.name}
                  </p>
                  <p className="text-[10px] text-dim">
                    {f.stage !== "N/A" ? f.stage : f.group_name}
                    {f.matchday ? ` · Day ${f.matchday}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusPill[f.status] ?? "bg-cobalt/10 text-cobalt"}`}>
                  {statusLabel[f.status]}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center text-navy text-xs font-bold shrink-0"
                    style={{ backgroundColor: AVATAR_PALETTE[(f.club_a?.name.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length] }}
                  >
                    {(f.club_a?.name ?? "A").split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">
                    {f.club_a?.name ?? "TBC"}
                  </p>
                </div>

                <div className="text-center px-1 shrink-0">
                  {f.confirmed_score ? (
                    <p className="font-display text-2xl font-bold text-white tabular-nums leading-none">
                      {f.confirmed_score.score_a}&nbsp;&ndash;&nbsp;{f.confirmed_score.score_b}
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-dim tracking-widest">VS</p>
                  )}
                  {f.scheduled_at && (
                    <p className="text-[10px] text-dim mt-1">
                      {new Date(f.scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center text-navy text-xs font-bold shrink-0"
                    style={{ backgroundColor: AVATAR_PALETTE[(f.club_b?.name.charCodeAt(0) ?? 3) % AVATAR_PALETTE.length] }}
                  >
                    {(f.club_b?.name ?? "B").split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">
                    {f.club_b?.name ?? "TBC"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
