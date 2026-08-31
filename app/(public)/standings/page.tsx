import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata = { title: "Standings" };

const AVATAR_PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

function avatarColor(name: string): string {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function nameInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function ClubAvatar({ name, logoUrl, logoStatus }: { name: string; logoUrl: string | null; logoStatus: string | null }) {
  const color   = avatarColor(name);
  const hasLogo = logoUrl && logoStatus === "approved";
  return (
    <div className="w-6 h-6 shrink-0 flex items-center justify-center overflow-hidden text-navy text-[9px] font-black" style={{ backgroundColor: hasLogo ? undefined : color }}>
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl!} alt={name} className="w-full h-full object-contain p-0.5" />
      ) : nameInitials(name)}
    </div>
  );
}

interface ClubRef {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  logo_status: string | null;
}

interface FixtureWithJoins {
  id:              string;
  stage:           string;
  group_name:      string;
  division_id:     string | null;
  matchday:        number;
  status:          string;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a:          ClubRef | null;
  club_b:          ClubRef | null;
  competition:     { id: string; name: string; slug: string } | null;
  division:        { id: string; name: string } | null;
}

interface StandingRow {
  clubId:        string;
  clubName:      string;
  clubSlug:      string;
  clubLogoUrl:   string | null;
  clubLogoStatus: string | null;
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
        id, stage, group_name, division_id, matchday, status, confirmed_score,
        club_a:clubs!club_a_id(id, name, slug, logo_url, logo_status),
        club_b:clubs!club_b_id(id, name, slug, logo_url, logo_status),
        competition:competitions(id, name, slug),
        division:faculty_divisions(id, name)
      `)
      .eq("status", "confirmed");
    return (fixtures ?? []) as FixtureWithJoins[];
  } catch {
    return [];
  }
}

function buildTable(fixtures: FixtureWithJoins[]): StandingRow[] {
  const map = new Map<string, StandingRow>();

  function ensure(club: ClubRef): StandingRow {
    if (!map.has(club.id)) {
      map.set(club.id, {
        clubId: club.id, clubName: club.name, clubSlug: club.slug,
        clubLogoUrl: club.logo_url, clubLogoStatus: club.logo_status,
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
  const [fixtures, siteSettings] = await Promise.all([getStandings(), getSiteSettings()]);
  const currentSeason      = siteSettings.current_season;
  const pageDescription    = siteSettings.standings_description;

  type Group = { competition: string; stage: string; group: string; divisionName: string | null; fixtures: FixtureWithJoins[] };
  const groups = fixtures.reduce<Record<string, Group>>((acc, f) => {
    const key = f.division_id
      ? `${f.competition?.id}__${f.stage}__division__${f.division_id}`
      : `${f.competition?.id}__${f.stage}__${f.group_name}`;
    if (!acc[key]) {
      acc[key] = {
        competition:  f.competition?.name ?? "Unknown",
        stage:        f.stage,
        group:        f.group_name,
        divisionName: f.division?.name ?? null,
        fixtures:     [],
      };
    }
    acc[key].fixtures.push(f);
    return acc;
  }, {});

  const tables = Object.values(groups);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-14">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">{currentSeason}</p>
        <h1 className="font-display font-black text-[3rem] text-white uppercase leading-none">Standings</h1>
        <p className="text-white/30 text-sm mt-3">{pageDescription}</p>
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
                    {g.divisionName ?? (g.stage !== "N/A" ? `${g.stage} Stage` : g.group)}
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
                          <Link href={`/clubs/${row.clubSlug}`} className="flex items-center gap-2.5 group">
                            <ClubAvatar name={row.clubName} logoUrl={row.clubLogoUrl} logoStatus={row.clubLogoStatus} />
                            <span className="font-semibold text-[13px] text-white/80 group-hover:text-white transition-colors">{row.clubName}</span>
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
