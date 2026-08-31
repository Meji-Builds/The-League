import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";
import { PromotionCard } from "./PromotionCard";

export const metadata = { title: "Admin — University Championship" };

// ─── Types ───────────────────────────────────────────────────────────────────

interface Faculty {
  id:       string;
  name:     string;
  logo_url: string | null;
}

interface Division {
  id:         string;
  faculty_id: string;
  name:       string;
}

interface ClubRef {
  id:          string;
  name:        string;
  slug:        string;
  logo_url:    string | null;
  logo_status: string | null;
}

interface FixtureRow {
  competition_id:  string;
  group_name:      string;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a:          ClubRef | null;
  club_b:          ClubRef | null;
}

interface Standing {
  clubId:   string;
  clubName: string;
  points:   number;
  gf:       number;
  ga:       number;
}

interface PromotionRow {
  id:          string;
  division_id: string;
  club_id:     string;
  position:    number;
  club:        { id: string; name: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildStandings(seededClubs: ClubRef[], fixtures: FixtureRow[]): Standing[] {
  const map = new Map<string, Standing>();

  for (const club of seededClubs) {
    map.set(club.id, { clubId: club.id, clubName: club.name, points: 0, gf: 0, ga: 0 });
  }

  function ensure(club: ClubRef): Standing {
    if (!map.has(club.id)) {
      map.set(club.id, { clubId: club.id, clubName: club.name, points: 0, gf: 0, ga: 0 });
    }
    return map.get(club.id)!;
  }

  for (const f of fixtures) {
    if (!f.confirmed_score || !f.club_a || !f.club_b) continue;
    const { score_a: sa, score_b: sb } = f.confirmed_score;
    const a = ensure(f.club_a);
    const b = ensure(f.club_b);

    a.gf += sa; a.ga += sb;
    b.gf += sb; b.ga += sa;

    if (sa > sb)      { a.points += 3; }
    else if (sb > sa) { b.points += 3; }
    else              { a.points += 1; b.points += 1; }
  }

  return [...map.values()].sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    if ((y.gf - y.ga) !== (x.gf - x.ga)) return (y.gf - y.ga) - (x.gf - x.ga);
    return x.clubName.localeCompare(y.clubName);
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminChampionshipPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;
  const siteSettings = await getSiteSettings();
  const currentSeason = siteSettings.current_season;

  // Fetch base data in parallel (faculties, divisions, clubs, competitions, promotions)
  const [
    { data: facultiesData },
    { data: divisionsData },
    { data: dcData },
    { data: compsData },
    { data: promotionsData },
  ] = await Promise.all([
    db.from("faculties").select("id, name, logo_url").order("display_order").order("name"),
    db.from("faculty_divisions").select("id, faculty_id, name").order("display_order").order("name"),
    db.from("division_clubs").select("division_id, club:clubs(id, name, slug, logo_url, logo_status)"),
    db.from("competitions").select("id, faculty_id").not("faculty_id", "is", null),
    db.from("division_promotions")
      .select("id, division_id, club_id, position, club:clubs(id, name)")
      .eq("season", currentSeason),
  ]);

  const faculties  = (facultiesData  ?? []) as Faculty[];
  const divisions  = (divisionsData  ?? []) as Division[];
  const promotions = (promotionsData ?? []) as PromotionRow[];

  // Build faculty→competition IDs map
  const facultyCompMap = new Map<string, string[]>();
  for (const comp of (compsData ?? []) as { id: string; faculty_id: string }[]) {
    if (!comp.faculty_id) continue;
    const arr = facultyCompMap.get(comp.faculty_id) ?? [];
    arr.push(comp.id);
    facultyCompMap.set(comp.faculty_id, arr);
  }

  // Build division→clubs map
  const dcMap = new Map<string, ClubRef[]>();
  for (const row of (dcData ?? []) as { division_id: string; club: ClubRef | null }[]) {
    if (!row.club) continue;
    const arr = dcMap.get(row.division_id) ?? [];
    arr.push(row.club);
    dcMap.set(row.division_id, arr);
  }

  // Build division→promotions map
  const promosMap = new Map<string, PromotionRow[]>();
  for (const promo of promotions) {
    const arr = promosMap.get(promo.division_id) ?? [];
    arr.push(promo);
    promosMap.set(promo.division_id, arr);
  }

  // Fetch all confirmed fixtures for all relevant competitions
  const allCompIds = [...facultyCompMap.values()].flat();
  const fixturesByKey = new Map<string, FixtureRow[]>();

  if (allCompIds.length > 0) {
    const { data: fixturesData } = await db
      .from("fixtures")
      .select(`
        competition_id, group_name, confirmed_score,
        club_a:clubs!fixtures_club_a_id_fkey(id, name, slug, logo_url, logo_status),
        club_b:clubs!fixtures_club_b_id_fkey(id, name, slug, logo_url, logo_status)
      `)
      .in("competition_id", allCompIds)
      .eq("status", "confirmed");

    for (const f of (fixturesData ?? []) as FixtureRow[]) {
      const key = `${f.competition_id}|${f.group_name}`;
      const arr = fixturesByKey.get(key) ?? [];
      arr.push(f);
      fixturesByKey.set(key, arr);
    }
  }

  // Group divisions by faculty
  const divsByFaculty = new Map<string, Division[]>();
  for (const div of divisions) {
    const arr = divsByFaculty.get(div.faculty_id) ?? [];
    arr.push(div);
    divsByFaculty.set(div.faculty_id, arr);
  }

  const confirmedCount = promotions.length; // each confirmed division = 2 entries

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">
          Admin · {currentSeason}
        </p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">
          University Championship
        </h1>
        <p className="text-white/40 text-[13px] mt-2">
          Confirm the top 2 promoted teams from each division. They advance to the University Championship.
        </p>
      </div>

      {/* Progress */}
      {divisions.length > 0 && (
        <div className="mb-8 flex items-center gap-4">
          <div className="flex-1 h-1 bg-white/5">
            <div
              className="h-full bg-success transition-all"
              style={{ width: `${Math.round((confirmedCount / 2 / Math.max(divisions.length, 1)) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-white/40 shrink-0">
            {confirmedCount / 2} / {divisions.length} divisions confirmed
          </p>
        </div>
      )}

      {/* Per-faculty sections */}
      {faculties.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No faculties set up yet.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {faculties.map((faculty) => {
            const facDivs = divsByFaculty.get(faculty.id) ?? [];
            if (facDivs.length === 0) return null;

            const compIds = facultyCompMap.get(faculty.id) ?? [];

            return (
              <div key={faculty.id}>
                <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">
                  {faculty.name}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {facDivs.map((div) => {
                    const divClubs = dcMap.get(div.id) ?? [];

                    // Collect fixtures for this division across all faculty competitions
                    const divFixtures: FixtureRow[] = [];
                    for (const compId of compIds) {
                      divFixtures.push(...(fixturesByKey.get(`${compId}|${div.name}`) ?? []));
                    }

                    const standings = buildStandings(divClubs, divFixtures);
                    const top2 = standings.slice(0, 2).map((s) => ({ id: s.clubId, name: s.clubName }));
                    const allClubs = divClubs.map((c) => ({ id: c.id, name: c.name }));

                    const divPromos = (promosMap.get(div.id) ?? []).map((p) => ({
                      id:       p.id,
                      clubId:   p.club_id,
                      clubName: (p.club as { name: string } | null)?.name ?? "Unknown",
                      position: p.position,
                    }));

                    return (
                      <PromotionCard
                        key={div.id}
                        divisionId={div.id}
                        divisionName={div.name}
                        facultyName={faculty.name}
                        top2={top2}
                        allClubs={allClubs}
                        promotions={divPromos}
                        season={currentSeason}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Championship Pool Summary */}
      {confirmedCount > 0 && (
        <div className="mt-14 border border-gold/20 bg-gold/[0.03] p-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-gold mb-5">
            Championship Pool — {confirmedCount} team{confirmedCount !== 1 ? "s" : ""} confirmed
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...promotions]
              .sort((a, b) => {
                // Sort by division (stable) then position
                const divCompare = a.division_id.localeCompare(b.division_id);
                return divCompare !== 0 ? divCompare : a.position - b.position;
              })
              .map((promo) => (
                <div key={promo.id} className="bg-navy border border-white/6 px-3 py-2.5">
                  <p className="text-[8px] text-dim uppercase tracking-[0.2em] mb-0.5">
                    Position {promo.position}
                  </p>
                  <p className="text-[12px] text-white/80 font-semibold leading-tight">
                    {(promo.club as { name: string } | null)?.name ?? "Unknown"}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
