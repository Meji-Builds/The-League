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
    db.from("competitions").select("id, name, format").order("name"),
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
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Standings</h1>
        <p className="text-white/40 text-[13px] mt-2">
          Automatically computed from confirmed results — no manual entry needed.
        </p>
        <div className="mt-4 bg-cobalt/8 border border-cobalt/20 px-4 py-3 text-[13px] text-white/70">
          Go to{" "}
          <Link href="/admin/results" className="text-cobalt hover:text-white transition-colors font-medium">Results</Link>
          {" "}and confirm a match report to update the table.
        </div>
      </div>

      {competitions.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No competitions yet.</p>
        </div>
      ) : (
        <>
          {/* Competition tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {competitions.map((c) => (
              <Link
                key={c.id}
                href={`/admin/standings?competition=${c.id}`}
                className={`text-xs font-semibold px-4 py-1.5 border transition-colors ${
                  c.id === competition?.id
                    ? "bg-cobalt text-navy border-cobalt"
                    : "border-white/10 text-white/40 hover:text-white hover:border-white/30"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {competition && (
            <div className="border border-white/6 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-dim">{competition.name}</p>
              </div>

              {standings.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-white/30 text-[13px]">No confirmed fixtures yet for this competition.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <thead>
                      <tr className="border-b border-white/6">
                        <th className="text-left px-5 py-3 text-[9px] font-bold uppercase tracking-[0.35em] text-dim w-8">#</th>
                        <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-[0.35em] text-dim">Club</th>
                        <th className="text-center px-3 py-3 text-[9px] font-bold uppercase tracking-[0.35em] text-dim">P</th>
                        <th className="text-center px-3 py-3 text-[9px] font-bold uppercase tracking-[0.35em] text-dim">W</th>
                        <th className="text-center px-3 py-3 text-[9px] font-bold uppercase tracking-[0.35em] text-dim">D</th>
                        <th className="text-center px-3 py-3 text-[9px] font-bold uppercase tracking-[0.35em] text-dim">L</th>
                        <th className="text-center px-3 py-3 text-[9px] font-bold uppercase tracking-[0.35em] text-dim">GF</th>
                        <th className="text-center px-3 py-3 text-[9px] font-bold uppercase tracking-[0.35em] text-dim">GA</th>
                        <th className="text-center px-3 py-3 text-[9px] font-bold uppercase tracking-[0.35em] text-dim">GD</th>
                        <th className="text-center px-3 py-3 text-[9px] font-bold uppercase tracking-[0.35em] text-dim">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {standings.map((row, i) => (
                        <tr key={row.club.id} className={`hover:bg-white/[0.02] transition-colors ${i === 0 ? "bg-gold/[0.03]" : ""}`}>
                          <td className="px-5 py-3.5 text-[11px] text-white/20 font-mono">{i + 1}</td>
                          <td className="px-4 py-3.5 font-medium text-[13px] text-white/80">{row.club.name}</td>
                          <td className="px-3 py-3.5 text-center text-[13px] text-white/40">{row.played}</td>
                          <td className="px-3 py-3.5 text-center text-[13px] text-success font-medium">{row.won}</td>
                          <td className="px-3 py-3.5 text-center text-[13px] text-white/40">{row.drawn}</td>
                          <td className="px-3 py-3.5 text-center text-[13px] text-danger">{row.lost}</td>
                          <td className="px-3 py-3.5 text-center text-[13px] text-white/40">{row.gf}</td>
                          <td className="px-3 py-3.5 text-center text-[13px] text-white/40">{row.ga}</td>
                          <td className="px-3 py-3.5 text-center text-[13px] text-white/40">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                          <td className="px-3 py-3.5 text-center font-display font-black text-xl text-gold">{row.points}</td>
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
