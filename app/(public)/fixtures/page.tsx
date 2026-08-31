import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata = { title: "Fixtures" };

interface ClubRef {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  logo_status: string | null;
}

interface FixtureRow {
  id:              string;
  stage:           string;
  group_name:      string;
  matchday:        number;
  status:          string;
  scheduled_at:    string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a:          ClubRef | null;
  club_b:          ClubRef | null;
  competition:     { id: string; name: string; slug: string } | null;
}

async function getFixtures(): Promise<FixtureRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("fixtures")
      .select(`
        id, stage, group_name, matchday, status, scheduled_at, confirmed_score,
        club_a:clubs!fixtures_club_a_id_fkey(id, name, slug, logo_url, logo_status),
        club_b:clubs!fixtures_club_b_id_fkey(id, name, slug, logo_url, logo_status),
        competition:competitions(id, name, slug)
      `)
      .order("scheduled_at", { ascending: true })
      .limit(100);
    return (data ?? []) as unknown as FixtureRow[];
  } catch {
    return [];
  }
}

const AVATAR_PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-cobalt",
  reported:  "bg-gold",
  disputed:  "bg-danger",
  confirmed: "bg-success",
};

const statusLabel: Record<string, string> = {
  scheduled: "Upcoming",
  reported:  "Reported",
  disputed:  "Disputed",
  confirmed: "FT",
};

function avatarColor(name: string): string {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function nameInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function ClubAvatar({ club, size = 7 }: { club: ClubRef | null; size?: number }) {
  const name   = club?.name ?? "?";
  const color  = avatarColor(name);
  const hasLogo = club?.logo_url && club.logo_status === "approved";
  const cls    = `w-${size} h-${size} shrink-0 flex items-center justify-center overflow-hidden text-navy text-[9px] font-black`;

  return (
    <div className={cls} style={{ backgroundColor: hasLogo ? undefined : color }}>
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={club!.logo_url!} alt={name} className="w-full h-full object-contain p-0.5" />
      ) : (
        nameInitials(name)
      )}
    </div>
  );
}

function formatGroupLabel(f: FixtureRow): string {
  const comp  = f.competition?.name ?? "Fixtures";
  const stage = f.stage && f.stage !== "N/A" ? ` · ${f.stage}` : "";
  const day   = f.matchday ? ` · Day ${f.matchday}` : "";
  return `${comp}${stage}${day}`;
}

export default async function FixturesPage() {
  const [fixtures, siteSettings] = await Promise.all([getFixtures(), getSiteSettings()]);
  const fixturesEyebrow = siteSettings.fixtures_eyebrow;

  type Group = { label: string; date: string | null; fixtures: FixtureRow[] };
  const groupMap = new Map<string, Group>();

  for (const f of fixtures) {
    const key = `${f.competition?.id ?? ""}__${f.stage}__${f.matchday}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, { label: formatGroupLabel(f), date: f.scheduled_at, fixtures: [] });
    }
    groupMap.get(key)!.fixtures.push(f);
  }

  const groups = [...groupMap.values()];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">{fixturesEyebrow}</p>
        <h1 className="font-display font-black text-[3rem] text-white uppercase leading-none">Fixtures</h1>
      </div>

      {groups.length === 0 ? (
        <div className="border border-white/8 bg-card px-8 py-16 text-center">
          <p className="text-white font-semibold">No fixtures scheduled yet.</p>
          <p className="text-white/35 text-sm mt-2">Check back once the competition stage begins.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((g, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-4 mb-3">
                <p className="text-[9px] font-bold text-gold uppercase tracking-[0.4em] whitespace-nowrap">{g.label}</p>
                <div className="flex-1 h-px bg-white/6" />
              </div>

              <div className="border border-white/6 divide-y divide-white/5 overflow-hidden">
                {g.fixtures.map((f) => (
                  <Link
                    key={f.id}
                    href={`/fixtures/${f.id}`}
                    className="flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors group overflow-hidden"
                  >
                    {/* Club A */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      <p className="hidden sm:block text-[13px] font-medium text-white/80 group-hover:text-white transition-colors truncate text-right">
                        {f.club_a?.name ?? "TBA"}
                      </p>
                      <ClubAvatar club={f.club_a} size={7} />
                    </div>

                    {/* Score / VS */}
                    <div className="w-16 text-center shrink-0">
                      {f.confirmed_score ? (
                        <span className="font-display font-black text-xl text-gold tabular-nums leading-none">
                          {f.confirmed_score.score_a}&nbsp;&ndash;&nbsp;{f.confirmed_score.score_b}
                        </span>
                      ) : (
                        <span className="text-[11px] text-white/20 font-bold tracking-[0.3em]">vs</span>
                      )}
                    </div>

                    {/* Club B */}
                    <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                      <ClubAvatar club={f.club_b} size={7} />
                      <p className="hidden sm:block text-[13px] font-medium text-white/80 group-hover:text-white transition-colors truncate">
                        {f.club_b?.name ?? "TBA"}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[f.status] ?? "bg-cobalt"}`} />
                        <span className="hidden sm:block text-[11px] text-white/30">{statusLabel[f.status] ?? f.status}</span>
                      </div>
                      {f.scheduled_at && (
                        <span className="text-[11px] text-white/20 tabular-nums">
                          {new Date(f.scheduled_at).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
