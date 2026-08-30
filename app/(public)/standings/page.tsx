import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Standings" };

// Standings are derived from confirmed fixtures.
// For each competition+stage+group, we compute W/D/L/GF/GA/GD/Pts.
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

interface FixtureWithJoins {
  id: string;
  stage: string;
  group_name: string;
  matchday: number;
  status: string;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a: { id: string; name: string; slug: string } | null;
  club_b: { id: string; name: string; slug: string } | null;
  competition: { id: string; name: string; slug: string } | null;
}

interface StandingRow {
  clubId: string;
  clubName: string;
  clubSlug: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
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

    if (sa > sb)       { a.won++;   a.points += 3; b.lost++; }
    else if (sb > sa)  { b.won++;   b.points += 3; a.lost++; }
    else               { a.drawn++; a.points += 1; b.drawn++; b.points += 1; }
  }

  return [...map.values()].sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    const gdY = y.goalsFor - y.goalsAgainst;
    const gdX = x.goalsFor - x.goalsAgainst;
    return gdY - gdX;
  });
}

export default async function StandingsPage() {
  const fixtures = await getStandings();

  // Group by competition -> stage -> group
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
      <h1 className="text-3xl font-bold text-navy mb-2">Standings</h1>
      <p className="text-muted text-sm mb-10">League tables, updated after every confirmed result.</p>

      {tables.length === 0 ? (
        <div className="border border-border bg-white px-8 py-14 text-center">
          <p className="text-navy font-semibold">No standings yet.</p>
          <p className="text-muted text-sm mt-2">
            Tables will appear here once results are confirmed.
          </p>
        </div>
      ) : (
        tables.map((g, i) => {
          const rows = buildTable(g.fixtures);
          return (
            <section key={i} className="mb-10">
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {g.competition}
                </p>
                <h2 className="text-base font-bold text-navy">
                  {g.stage !== "N/A" ? `${g.stage} Stage` : g.group}
                </h2>
              </div>

              <div className="bg-white border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted uppercase tracking-wider">
                      <th className="text-left px-4 py-2 font-semibold w-6">#</th>
                      <th className="text-left px-4 py-2 font-semibold">Club</th>
                      <th className="px-3 py-2 font-semibold text-center">P</th>
                      <th className="px-3 py-2 font-semibold text-center">W</th>
                      <th className="px-3 py-2 font-semibold text-center">D</th>
                      <th className="px-3 py-2 font-semibold text-center">L</th>
                      <th className="px-3 py-2 font-semibold text-center">GF</th>
                      <th className="px-3 py-2 font-semibold text-center">GA</th>
                      <th className="px-3 py-2 font-semibold text-center">GD</th>
                      <th className="px-3 py-2 font-semibold text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row, rank) => (
                      <tr key={row.clubId} className="hover:bg-surface transition-colors">
                        <td className="px-4 py-3 text-muted text-xs">{rank + 1}</td>
                        <td className="px-4 py-3 font-semibold text-navy">{row.clubName}</td>
                        <td className="px-3 py-3 text-center text-muted">{row.played}</td>
                        <td className="px-3 py-3 text-center">{row.won}</td>
                        <td className="px-3 py-3 text-center text-muted">{row.drawn}</td>
                        <td className="px-3 py-3 text-center text-muted">{row.lost}</td>
                        <td className="px-3 py-3 text-center text-muted">{row.goalsFor}</td>
                        <td className="px-3 py-3 text-center text-muted">{row.goalsAgainst}</td>
                        <td className="px-3 py-3 text-center text-muted">
                          {row.goalsFor - row.goalsAgainst > 0
                            ? `+${row.goalsFor - row.goalsAgainst}`
                            : row.goalsFor - row.goalsAgainst}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-navy">{row.points}</td>
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
