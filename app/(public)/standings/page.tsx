import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Standings" };

interface FixtureWithJoins {
  id:              string;
  stage:           string;
  group_name:      string;
  matchday:        number;
  status:          string;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a:          { id: string; name: string; slug: string } | null;
  club_b:          { id: string; name: string; slug: string } | null;
  competition:     { id: string; name: string; slug: string } | null;
}

interface StandingRow {
  clubId:        string;
  clubName:      string;
  clubSlug:      string;
  played:        number;
  won:           number;
  drawn:         number;
  lost:          number;
  goalsFor:      number;
  goalsAgainst:  number;
  points:        number;
}

async function getStandings(): Promise<FixtureWithJoins[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (await createClient()) as any;
    const { data: fixtures } = await db
      .from("fixtures")
      .select(`
        id, stage, group_name, matchday, status, confirmed_score,
        club_a:clubs!club_a_id(id, name, slug),
        club_b:clubs!club_b_id(id, name, slug),
        competition:competitions(id, name, slug)
      `)
      .eq("status", "confirmed");
    return (fixtures ?? []) as FixtureWithJoins[];
  } catch {
    return [];
  }
}

function buildTable(fixtures: FixtureWithJoins[]): StandingRow[] {
  const map = new Map<string, StandingRow>();

  function ensure(club: { id: string; name: string; slug: string }): StandingRow {
    if (!map.has(club.id)) {
      map.set(club.id, {
        clubId: club.id, clubName: club.name, clubSlug: club.slug,
        played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
      });
    }
    return map.get(club.id)!;
  }

  for (const f of fixtures) {
    if (!f.confirmed_score || !f.club_a || !f.club_b) continue;
    const { score_a: sa, score_b: sb } = f.confirmed_score;
    const a = ensure(f.club_a);
    const b = ensure(f.club_b);

    a.played++; b.played++;
    a.goalsFor += sa; a.goalsAgainst += sb;
    b.goalsFor += sb; b.goalsAgainst += sa;

    if (sa > sb)      { a.won++;   a.points += 3; b.lost++; }
    else if (sb > sa) { b.won++;   b.points += 3; a.lost++; }
    else              { a.drawn++; a.points += 1; b.drawn++; b.points += 1; }
  }

  return [...map.values()].sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    return (y.goalsFor - y.goalsAgainst) - (x.goalsFor - x.goalsAgainst);
  });
}

export default async function StandingsPage() {
  const fixtures = await getStandings();

  type Group = { competition: string; stage: string; group: string; fixtures: FixtureWithJoins[] };
  const groups = fixtures.reduce<Record<string, Group>>((acc, f) => {
    const key = `${f.competition?.id}__${f.stage}__${f.group_name}`;
    if (!acc[key]) {
      acc[key] = {
        competition: f.competition?.name ?? "Unknown",
        stage: f.stage,
        group: f.group_name,
        fixtures: [],
      };
    }
    acc[key].fixtures.push(f);
    return acc;
  }, {});

  const tables = Object.values(groups);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-14">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Season 2025</p>
        <h1 className="font-display font-black text-[3rem] text-white uppercase leading-none">Standings</h1>
        <p className="text-white/30 text-sm mt-3">Updated after every confirmed result.</p>
      </div>

      {tables.length === 0 ? (
        <div className="border border-white/8 bg-card px-8 py-16 text-center">
          <p className="text-white font-semibold">No standings yet.</p>
          <p className="text-white/35 text-sm mt-2">
            Tables will appear here once results are confirmed.
          </p>
        </div>
      ) : (
        tables.map((g, i) => {
          const rows = buildTable(g.fixtures);
          return (
            <section key={i} className="mb-12">
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold/70">{g.competition}</p>
                  <p className="text-base font-display font-black text-white uppercase mt-0.5">
                    {g.stage !== "N/A" ? `${g.stage} Stage` : g.group}
                  </p>
                </div>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="border border-white/6 overflow-x-auto">
                <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <thead>
                    <tr className="border-b border-white/6 text-[10px] text-white/25 uppercase tracking-[0.15em]">
                      <th className="text-left font-bold px-5 py-3 w-8">#</th>
                      <th className="text-left font-bold px-4 py-3">Club</th>
                      <th className="text-center font-bold px-3 py-3">P</th>
                      <th className="text-center font-bold px-3 py-3">W</th>
                      <th className="text-center font-bold px-3 py-3">D</th>
                      <th className="text-center font-bold px-3 py-3">L</th>
                      <th className="text-center font-bold px-3 py-3 hidden sm:table-cell">GF</th>
                      <th className="text-center font-bold px-3 py-3 hidden sm:table-cell">GA</th>
                      <th className="text-center font-bold px-3 py-3">GD</th>
                      <th className="text-center font-bold px-5 py-3">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {rows.map((row, rank) => (
                      <tr
                        key={row.clubId}
                        className={`hover:bg-white/[0.025] transition-colors ${rank === 0 ? "bg-gold/[0.04]" : ""}`}
                      >
                        <td className="px-5 py-4 text-white/20 text-xs font-mono">{rank + 1}</td>
                        <td className="px-4 py-4">
                          <Link href={`/clubs/${row.clubSlug}`} className="font-semibold text-white hover:text-gold transition-colors text-sm">
                            {row.clubName}
                          </Link>
                        </td>
                        <td className="px-3 py-4 text-center text-white/35 text-sm">{row.played}</td>
                        <td className="px-3 py-4 text-center text-white text-sm font-medium">{row.won}</td>
                        <td className="px-3 py-4 text-center text-white/35 text-sm">{row.drawn}</td>
                        <td className="px-3 py-4 text-center text-white/35 text-sm">{row.lost}</td>
                        <td className="px-3 py-4 text-center text-white/35 text-sm hidden sm:table-cell">{row.goalsFor}</td>
                        <td className="px-3 py-4 text-center text-white/35 text-sm hidden sm:table-cell">{row.goalsAgainst}</td>
                        <td className="px-3 py-4 text-center text-white/40 text-sm">
                          {row.goalsFor - row.goalsAgainst > 0
                            ? `+${row.goalsFor - row.goalsAgainst}`
                            : row.goalsFor - row.goalsAgainst}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-display font-black text-xl text-gold leading-none">{row.points}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
