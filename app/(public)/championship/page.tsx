import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata = { title: "University Championship" };

interface Faculty {
  id:       string;
  name:     string;
  slug:     string;
  logo_url: string | null;
}

interface PromotionRow {
  id:          string;
  division_id: string;
  club_id:     string;
  position:    number;
  club: {
    id:          string;
    name:        string;
    slug:        string;
    logo_url:    string | null;
    logo_status: string | null;
  } | null;
  division: {
    id:         string;
    name:       string;
    faculty_id: string;
  } | null;
}

const PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

function badgeColor(name: string) {
  return PALETTE[name.charCodeAt(0) % PALETTE.length];
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function ClubBadge({ name, logoUrl, logoStatus }: { name: string; logoUrl: string | null; logoStatus: string | null }) {
  const hasLogo = logoUrl && logoStatus === "approved";
  return (
    <div
      className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden text-navy text-[11px] font-black"
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

export default async function ChampionshipPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;
  const siteSettings = await getSiteSettings();
  const currentSeason = siteSettings.current_season;

  const [{ data: facultiesData }, { data: promotionsData }] = await Promise.all([
    db.from("faculties").select("id, name, slug, logo_url").order("display_order").order("name"),
    db
      .from("division_promotions")
      .select(`
        id, division_id, club_id, position,
        club:clubs(id, name, slug, logo_url, logo_status),
        division:faculty_divisions(id, name, faculty_id)
      `)
      .eq("season", currentSeason)
      .order("position"),
  ]);

  const faculties  = (facultiesData  ?? []) as Faculty[];
  const promotions = (promotionsData ?? []) as PromotionRow[];

  // Group promotions by faculty_id (via division.faculty_id)
  const promosByFaculty = new Map<string, PromotionRow[]>();
  for (const promo of promotions) {
    if (!promo.division?.faculty_id) continue;
    const arr = promosByFaculty.get(promo.division.faculty_id) ?? [];
    arr.push(promo);
    promosByFaculty.set(promo.division.faculty_id, arr);
  }

  const totalTeams = promotions.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-14">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">{currentSeason}</p>
        <h1 className="font-display font-black text-[3rem] text-white uppercase leading-none">
          University Championship
        </h1>
        <p className="text-white/35 text-sm mt-3 max-w-lg">
          The top 2 teams from each faculty division advance to compete for the University Championship title.
        </p>
      </div>

      {totalTeams === 0 ? (
        <div className="border border-white/8 bg-card px-8 py-16 text-center">
          <p className="text-white font-semibold">No teams confirmed yet.</p>
          <p className="text-white/35 text-sm mt-2">
            Championship qualifiers will appear here once each faculty league names its top 2.
          </p>
          <Link href="/leagues" className="inline-block mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-cobalt hover:text-white transition-colors">
            View League Standings →
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {faculties.map((faculty) => {
            const facPromos = promosByFaculty.get(faculty.id) ?? [];
            if (facPromos.length === 0) return null;

            // Group by division
            const byDivision = new Map<string, PromotionRow[]>();
            for (const p of facPromos) {
              const divId = p.division?.id ?? "unknown";
              const arr = byDivision.get(divId) ?? [];
              arr.push(p);
              byDivision.set(divId, arr);
            }

            return (
              <div key={faculty.id}>
                {/* Faculty heading */}
                <div className="flex items-center gap-3 mb-5">
                  {faculty.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={faculty.logo_url} alt={faculty.name} className="w-5 h-5 object-contain" />
                  ) : null}
                  <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim">{faculty.name}</p>
                </div>

                <div className="space-y-6">
                  {[...byDivision.entries()].map(([, divPromos]) => {
                    const divisionName = divPromos[0]?.division?.name ?? "Division";
                    const sorted = [...divPromos].sort((a, b) => a.position - b.position);

                    return (
                      <div key={divisionName} className="border border-white/6 bg-card">
                        <div className="px-5 py-3 border-b border-white/5 bg-white/[0.015]">
                          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-dim">{divisionName}</p>
                        </div>
                        <div className="divide-y divide-white/4">
                          {sorted.map((promo) => {
                            const club = promo.club;
                            if (!club) return null;
                            return (
                              <div key={promo.id} className="flex items-center gap-4 px-5 py-4">
                                <span className="text-[10px] text-gold font-display font-black w-4 shrink-0">
                                  {promo.position}
                                </span>
                                <ClubBadge
                                  name={club.name}
                                  logoUrl={club.logo_url}
                                  logoStatus={club.logo_status}
                                />
                                <div className="flex-1 min-w-0">
                                  <Link
                                    href={`/clubs/${club.slug}`}
                                    className="font-semibold text-[13px] text-white/80 hover:text-white transition-colors"
                                  >
                                    {club.name}
                                  </Link>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gold/60 border border-gold/20 px-2 py-0.5 shrink-0">
                                  Qualified
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Pool summary */}
          <div className="mt-4 border border-white/6 px-6 py-5 flex items-center gap-4">
            <div>
              <p className="font-display font-black text-[2rem] text-gold leading-none">{totalTeams}</p>
              <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mt-0.5">Teams Qualified</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <p className="text-[12px] text-white/40">
              Representing {promosByFaculty.size} faculty league{promosByFaculty.size !== 1 ? "s" : ""} in {currentSeason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
