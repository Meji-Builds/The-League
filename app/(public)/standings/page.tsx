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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-white uppercase tracking-tight">Standings</h1>
        <p className="text-dim text-sm mt-1">Updated after every confirmed result.</p>
      </div>

      {tables.length === 0 ? (
        <div className="border border-rim bg-card px-8 py-14 text-center rounded">
          <p className="text-white font-semibold">No standings yet.</p>
          <p className="text-dim text-sm mt-2">
            Tables will appear here once results are confirmed.
          </p>
        </div>
      ) : (
        tables.map((g, i) => {
          const rows = buildTable(g.fixtures);
          return (
            <section key={i} className="mb-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gold uppercase tracking-wider truncate">{g.competition}</p>
                  <p className="text-sm font-semibold text-white">
                    {g.stage !== "N/A" ? `${g.stage} Stage` : g.group}
                  </p>
                </div>
                <div className="flex-1 h-px bg-rim" />
              </div>

              <div className="bg-card border border-rim rounded overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-rim text-xs text-dim uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-bold w-6">#</th>
                      <th className="text-left px-4 py-3 font-bold">Club</th>
                      <th className="px-3 py-3 font-bold text-center">P</th>
                      <th className="px-3 py-3 font-bold text-center">W</th>
                      <th className="px-3 py-3 font-bold text-center">D</th>
                      <th className="px-3 py-3 font-bold text-center">L</th>
                      <th className="px-3 py-3 font-bold text-center">GF</th>
                      <th className="px-3 py-3 font-bold text-center">GA</th>
                      <th className="px-3 py-3 font-bold text-center">GD</th>
                      <th className="px-3 py-3 font-bold text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rim">
                    {rows.map((row, rank) => (
                      <tr key={row.clubId} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-dim text-xs">{rank + 1}</td>
                        <td className="px-4 py-3 font-semibold text-white">{row.clubName}</td>
                        <td className="px-3 py-3 text-center text-dim">{row.played}</td>
                        <td className="px-3 py-3 text-center text-white">{row.won}</td>
                        <td className="px-3 py-3 text-center text-dim">{row.drawn}</td>
                        <td className="px-3 py-3 text-center text-dim">{row.lost}</td>
                        <td className="px-3 py-3 text-center text-dim">{row.goalsFor}</td>
                        <td className="px-3 py-3 text-center text-dim">{row.goalsAgainst}</td>
                        <td className="px-3 py-3 text-center text-dim">
                          {row.goalsFor - row.goalsAgainst > 0
                            ? `+${row.goalsFor - row.goalsAgainst}`
                            : row.goalsFor - row.goalsAgainst}
                        </td>
                        <td className="px-3 py-3 text-center font-display font-bold text-gold text-base">
                          {row.points}
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
