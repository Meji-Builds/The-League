import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Admin — Standings" };

interface Competition {
  id:   string;
  name: string;
  format: string;
}

interface ConfirmedFixture {
  club_a_id:       string;
  club_b_id:       string;
  winner_club_id:  string | null;
  confirmed_score: { score_a: number; score_b: number };
  competition_id:  string;
}

interface ClubInfo {
  id:   string;
  name: string;
  slug: string;
}

interface StandingRow {
  club:    ClubInfo;
  played:  number;
  won:     number;
  drawn:   number;
  lost:    number;
  gf:      number;
  ga:      number;
  gd:      number;
  points:  number;
}

function computeStandings(fixtures: ConfirmedFixture[], clubs: ClubInfo[]): StandingRow[] {
  const map = new Map<string, Omit<StandingRow, "club">>();

  for (const f of fixtures) {
    for (const clubId of [f.club_a_id, f.club_b_id]) {
      if (!map.has(clubId)) map.set(clubId, { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 });
    }

    const isA   = (id: string) => id === f.club_a_id;
    const sA    = f.confirmed_score.score_a;
    const sB    = f.confirmed_score.score_b;

    for (const clubId of [f.club_a_id, f.club_b_id]) {
      const row = map.get(clubId)!;
      const myScore  = isA(clubId) ? sA : sB;
      const oppScore = isA(clubId) ? sB : sA;
      row.played++;
      row.gf += myScore;
      row.ga += oppScore;
      if (f.winner_club_id === clubId) {
        row.won++;
        row.points += 3;
      } else if (f.winner_club_id === null) {
        row.drawn++;
        row.points += 1;
      } else {
        row.lost++;
      }
      row.gd = row.gf - row.ga;
    }
  }

  const clubMap = new Map(clubs.map((c) => [c.id, c]));

  return [...map.entries()]
    .map(([clubId, stats]) => ({ club: clubMap.get(clubId) ?? { id: clubId, name: "Unknown", slug: "" }, ...stats }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
}

export default async function AdminStandingsPage({ searchParams }: { searchParams: Promise<{ competition?: string }> }) {
  const { competition: selectedId } = await searchParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const [{ data: rawComps }, { data: rawClubs }] = await Promise.all([
    db.from("competitions").select("id, name, format").in("status", ["in_progress", "completed"]).order("name"),
    db.from("clubs").select("id, name, slug").eq("status", "approved"),
  ]);

  const competitions = (rawComps ?? []) as Competition[];
  const clubs        = (rawClubs ?? []) as ClubInfo[];
  const competition  = competitions.find((c) => c.id === selectedId) ?? competitions[0] ?? null;

  let standings: StandingRow[] = [];

  if (competition) {
    const { data: rawFixtures } = await db
      .from("fixtures")
      .select("club_a_id, club_b_id, winner_club_id, confirmed_score, competition_id")
      .eq("competition_id", competition.id)
      .eq("status", "confirmed");

    standings = computeStandings((rawFixtures ?? []) as ConfirmedFixture[], clubs);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Standings</h1>
        <p className="text-muted text-sm mt-1">
          Automatically computed from confirmed results — no manual entry needed.
        </p>
        <div className="mt-3 bg-cobalt/5 border border-cobalt/20 rounded px-4 py-3 text-sm text-navy">
          <span className="font-semibold">How to update standings:</span> Go to{" "}
          <Link href="/admin/results" className="text-cobalt hover:underline font-medium">Results</Link>
          {" "}→ review submitted match reports from clubs → click <strong>Confirm Result</strong>.
          The table below updates instantly.
        </div>
      </div>

      {competitions.length === 0 ? (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No in-progress or completed competitions yet.</p>
        </div>
      ) : (
        <>
          {/* Competition tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {competitions.map((c) => (
              <Link
                key={c.id}
                href={`/admin/standings?competition=${c.id}`}
                className={`text-xs font-semibold px-4 py-1.5 rounded border transition-colors ${
                  c.id === competition?.id
                    ? "bg-navy text-white border-navy"
                    : "border-border bg-white text-navy hover:border-cobalt"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {competition && (
            <div className="border border-border bg-white rounded overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-surface">
                <p className="text-xs font-semibold text-navy uppercase tracking-wide">{competition.name}</p>
              </div>

              {standings.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-muted text-sm">No confirmed fixtures yet for this competition.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted w-8">#</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Club</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted">P</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted">W</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted">D</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted">L</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted">GF</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted">GA</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted">GD</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide text-navy font-bold">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {standings.map((row, i) => (
                        <tr key={row.club.id} className="hover:bg-surface transition-colors">
                          <td className="px-5 py-3 text-xs text-muted text-center">{i + 1}</td>
                          <td className="px-5 py-3 font-semibold text-navy">{row.club.name}</td>
                          <td className="px-3 py-3 text-center text-muted">{row.played}</td>
                          <td className="px-3 py-3 text-center text-success font-semibold">{row.won}</td>
                          <td className="px-3 py-3 text-center text-muted">{row.drawn}</td>
                          <td className="px-3 py-3 text-center text-danger">{row.lost}</td>
                          <td className="px-3 py-3 text-center text-muted">{row.gf}</td>
                          <td className="px-3 py-3 text-center text-muted">{row.ga}</td>
                          <td className="px-3 py-3 text-center text-muted">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                          <td className="px-3 py-3 text-center font-bold text-navy">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
