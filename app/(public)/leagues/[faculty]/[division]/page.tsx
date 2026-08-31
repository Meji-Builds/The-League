import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";

interface Faculty {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface Division {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface ClubRef {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  logo_status: string | null;
}

interface FixtureRow {
  id: string;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a: ClubRef | null;
  club_b: ClubRef | null;
}

interface Standing {
  clubId:        string;
  clubName:      string;
  clubSlug:      string;
  clubLogoUrl:   string | null;
  clubLogoStatus: string | null;
  played:  number;
  won:     number;
  drawn:   number;
  lost:    number;
  gf:      number;
  ga:      number;
  points:  number;
}

const PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

function badgeColor(name: string) {
  return PALETTE[name.charCodeAt(0) % PALETTE.length];
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function ClubAvatar({ name, logoUrl, logoStatus }: { name: string; logoUrl: string | null; logoStatus: string | null }) {
  const hasLogo = logoUrl && logoStatus === "approved";
  return (
    <div
      className="w-6 h-6 shrink-0 flex items-center justify-center overflow-hidden text-navy text-[9px] font-black"
      style={{ backgroundColor: hasLogo ? undefined : badgeColor(name) }}
    >
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl!} alt={name} className="w-full h-full object-contain p-0.5" />
      ) : (
        initials(name)
      )}
    </div>
  );
}

function buildStandings(seededClubs: ClubRef[], fixtures: FixtureRow[]): Standing[] {
  const map = new Map<string, Standing>();

  // Seed all division clubs at zero so the table always shows
  for (const club of seededClubs) {
    map.set(club.id, {
      clubId: club.id, clubName: club.name, clubSlug: club.slug,
      clubLogoUrl: club.logo_url, clubLogoStatus: club.logo_status,
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0,
    });
  }

  function ensure(club: ClubRef): Standing {
    if (!map.has(club.id)) {
      map.set(club.id, {
        clubId: club.id, clubName: club.name, clubSlug: club.slug,
        clubLogoUrl: club.logo_url, clubLogoStatus: club.logo_status,
        played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0,
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
    a.gf += sa; a.ga += sb;
    b.gf += sb; b.ga += sa;

    if (sa > sb)      { a.won++;   a.points += 3; b.lost++; }
    else if (sb > sa) { b.won++;   b.points += 3; a.lost++; }
    else              { a.drawn++; a.points += 1; b.drawn++; b.points += 1; }
  }

  return [...map.values()].sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    if ((y.gf - y.ga) !== (x.gf - x.ga)) return (y.gf - y.ga) - (x.gf - x.ga);
    return x.clubName.localeCompare(y.clubName); // alpha tiebreak when all zeros
  });
}

export default async function DivisionStandingsPage({
  params,
}: {
  params: Promise<{ faculty: string; division: string }>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;
  const { faculty: facultySlug, division: divisionSlug } = await params;

  // Resolve faculty + division sequentially (division needs faculty.id)
  const { data: facultyData } = await db
    .from("faculties")
    .select("id, name, slug, logo_url")
    .eq("slug", facultySlug)
    .single();

  if (!facultyData) notFound();
  const faculty = facultyData as Faculty;

  const [{ data: divisionData }, siteSettings] = await Promise.all([
    db
      .from("faculty_divisions")
      .select("id, name, slug, logo_url")
      .eq("faculty_id", faculty.id)
      .eq("slug", divisionSlug)
      .single(),
    getSiteSettings(),
  ]);

  if (!divisionData) notFound();
  const division = divisionData as Division;

  // Fetch assigned clubs + competition fixtures in parallel
  const [{ data: compsData }, { data: dcData }] = await Promise.all([
    db.from("competitions").select("id").eq("faculty_id", faculty.id),
    db
      .from("division_clubs")
      .select("club:clubs(id, name, slug, logo_url, logo_status)")
      .eq("division_id", division.id),
  ]);

  const competitionIds = (compsData ?? []).map((c: { id: string }) => c.id);
  const seededClubs: ClubRef[] = (dcData ?? [])
    .map((r: { club: ClubRef | null }) => r.club)
    .filter(Boolean) as ClubRef[];

  let fixtures: FixtureRow[] = [];
  if (competitionIds.length > 0) {
    const { data: fixturesData } = await db
      .from("fixtures")
      .select(`
        id, confirmed_score,
        club_a:clubs!fixtures_club_a_id_fkey(id, name, slug, logo_url, logo_status),
        club_b:clubs!fixtures_club_b_id_fkey(id, name, slug, logo_url, logo_status)
      `)
      .in("competition_id", competitionIds)
      .eq("group_name", division.name)
      .eq("status", "confirmed");
    fixtures = (fixturesData ?? []) as FixtureRow[];
  }

  const standings = buildStandings(seededClubs, fixtures);
  const currentSeason = siteSettings.current_season;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-10 text-[11px] text-white/30 flex-wrap">
        <Link href="/leagues" className="hover:text-white/60 transition-colors">Leagues</Link>
        <span>/</span>
        <Link href={`/leagues/${faculty.slug}`} className="hover:text-white/60 transition-colors">{faculty.name}</Link>
        <span>/</span>
        <span className="text-white/50">{division.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-6 mb-14">
        {/* Division logo */}
        <div
          className="w-16 h-16 flex items-center justify-center overflow-hidden shrink-0"
          style={{ backgroundColor: division.logo_url ? undefined : badgeColor(division.name) }}
        >
          {division.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={division.logo_url} alt={division.name} className="w-full h-full object-contain p-1" />
          ) : (
            <span className="font-display font-black text-xl text-navy">{initials(division.name)}</span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            {faculty.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={faculty.logo_url} alt={faculty.name} className="w-4 h-4 object-contain" />
            ) : null}
            <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim">{faculty.name} · {currentSeason}</p>
          </div>
          <h1 className="font-display font-black text-[2.5rem] text-white uppercase leading-none">{division.name}</h1>
          <p className="text-white/35 text-sm mt-1">
            {standings.length} club{standings.length !== 1 ? "s" : ""}
            {standings.length > 0 && " · Live standings"}
          </p>
        </div>
      </div>

      {/* Standings table */}
      {standings.length === 0 ? (
        <div className="border border-white/8 bg-card px-8 py-16 text-center">
          <p className="text-white font-semibold">No clubs in this division yet.</p>
          <p className="text-white/35 text-sm mt-2">Clubs will appear once they are assigned to this division.</p>
        </div>
      ) : (
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
              {standings.map((row, rank) => (
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
                  <td className="px-3 py-4 text-center text-white/35 text-sm hidden sm:table-cell">{row.gf}</td>
                  <td className="px-3 py-4 text-center text-white/35 text-sm hidden sm:table-cell">{row.ga}</td>
                  <td className="px-3 py-4 text-center text-white/40 text-sm">
                    {row.gf - row.ga > 0 ? `+${row.gf - row.ga}` : row.gf - row.ga}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-display font-black text-xl text-gold leading-none">{row.points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
