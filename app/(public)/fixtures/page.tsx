import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Fixtures" };

interface FixtureRow {
  id: string;
  stage: string;
  group_name: string;
  matchday: number;
  status: string;
  scheduled_at: string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a: { id: string; name: string; slug: string; logo_url: string | null } | null;
  club_b: { id: string; name: string; slug: string; logo_url: string | null } | null;
  competition: { id: string; name: string; slug: string } | null;
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

const AVATAR_PALETTE = ["#2D4A7C", "#C9A227", "#2D7A4F", "#B91C1C", "#7C2D96", "#0369A1"];

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
      <h1 className="text-3xl font-bold text-navy mb-2">Fixtures</h1>
      <p className="text-muted text-sm mb-10">All scheduled and completed matches.</p>

      {fixtures.length === 0 ? (
        <div className="border border-border bg-white px-8 py-14 text-center">
          <p className="text-navy font-semibold">No fixtures scheduled yet.</p>
          <p className="text-muted text-sm mt-2">Check back once the competition stage begins.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fixtures.map((f) => (
            <Link key={f.id} href={`/fixtures/${f.id}`} className="block bg-white border border-border p-4 hover:border-cobalt transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 mr-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cobalt truncate">
                    {f.competition?.name}
                  </p>
                  <p className="text-[10px] text-muted">
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
                    className="w-10 h-10 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: AVATAR_PALETTE[(f.club_a?.name.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length] }}
                  >
                    {(f.club_a?.name ?? "A").split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-navy text-center leading-tight line-clamp-2">
                    {f.club_a?.name ?? "TBC"}
                  </p>
                </div>

                <div className="text-center px-1 shrink-0">
                  {f.confirmed_score ? (
                    <p className="text-xl font-bold text-navy tabular-nums leading-none">
                      {f.confirmed_score.score_a}&nbsp;&ndash;&nbsp;{f.confirmed_score.score_b}
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-muted tracking-widest">VS</p>
                  )}
                  {f.scheduled_at && (
                    <p className="text-[10px] text-muted mt-1">
                      {new Date(f.scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: AVATAR_PALETTE[(f.club_b?.name.charCodeAt(0) ?? 3) % AVATAR_PALETTE.length] }}
                  >
                    {(f.club_b?.name ?? "B").split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-navy text-center leading-tight line-clamp-2">
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
