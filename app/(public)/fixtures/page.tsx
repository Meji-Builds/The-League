import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Fixtures" };

interface FixtureRow {
  id:              string;
  stage:           string;
  group_name:      string;
  matchday:        number;
  status:          string;
  scheduled_at:    string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a:          { id: string; name: string; slug: string } | null;
  club_b:          { id: string; name: string; slug: string } | null;
  competition:     { id: string; name: string; slug: string } | null;
}

async function getFixtures(): Promise<FixtureRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("fixtures")
      .select(`
        id, stage, group_name, matchday, status, scheduled_at, confirmed_score,
        club_a:clubs!fixtures_club_a_id_fkey(id, name, slug),
        club_b:clubs!fixtures_club_b_id_fkey(id, name, slug),
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

const statusPill: Record<string, string> = {
  scheduled: "bg-cobalt/15 text-cobalt",
  reported:  "bg-gold/15 text-gold",
  disputed:  "bg-danger/15 text-danger",
  confirmed: "bg-success/15 text-success",
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

function formatGroupLabel(f: FixtureRow): string {
  const comp = f.competition?.name ?? "Fixtures";
  const stage = f.stage && f.stage !== "N/A" ? ` · ${f.stage}` : "";
  const day = f.matchday ? ` · Day ${f.matchday}` : "";
  return `${comp}${stage}${day}`;
}

export default async function FixturesPage() {
  const fixtures = await getFixtures();

  // Group by competition + stage + matchday
  type Group = { label: string; date: string | null; fixtures: FixtureRow[] };
  const groupMap = new Map<string, Group>();

  for (const f of fixtures) {
    const key = `${f.competition?.id ?? ""}__${f.stage}__${f.matchday}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        label: formatGroupLabel(f),
        date: f.scheduled_at,
        fixtures: [],
      });
    }
    groupMap.get(key)!.fixtures.push(f);
  }

  const groups = [...groupMap.values()];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-white uppercase tracking-tight">Fixtures</h1>
        <p className="text-dim text-sm mt-1">All scheduled and completed matches.</p>
      </div>

      {groups.length === 0 ? (
        <div className="border border-rim bg-card px-8 py-14 text-center">
          <p className="text-white font-semibold text-sm">No fixtures scheduled yet.</p>
          <p className="text-dim text-sm mt-2">Check back once the competition stage begins.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-xs font-semibold text-gold uppercase tracking-wider">{g.label}</p>
                <div className="flex-1 h-px bg-rim" />
              </div>

              <div className="border border-rim divide-y divide-rim">
                {g.fixtures.map((f) => (
                  <Link
                    key={f.id}
                    href={`/fixtures/${f.id}`}
                    className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 hover:bg-white/[0.035] transition-colors group"
                  >
                    {/* Club A */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      <p className="text-[13px] font-medium text-white group-hover:text-gold transition-colors truncate text-right">
                        {f.club_a?.name ?? "TBA"}
                      </p>
                      <div
                        className="w-7 h-7 shrink-0 flex items-center justify-center text-navy text-[9px] font-bold"
                        style={{ backgroundColor: avatarColor(f.club_a?.name ?? "A") }}
                      >
                        {nameInitials(f.club_a?.name ?? "A")}
                      </div>
                    </div>

                    {/* Score / VS */}
                    <div className="w-20 text-center shrink-0">
                      {f.confirmed_score ? (
                        <span className="font-display text-base font-bold text-gold tabular-nums">
                          {f.confirmed_score.score_a}&nbsp;&ndash;&nbsp;{f.confirmed_score.score_b}
                        </span>
                      ) : (
                        <span className="text-xs text-dim tracking-widest">vs</span>
                      )}
                    </div>

                    {/* Club B */}
                    <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                      <div
                        className="w-7 h-7 shrink-0 flex items-center justify-center text-navy text-[9px] font-bold"
                        style={{ backgroundColor: avatarColor(f.club_b?.name ?? "B") }}
                      >
                        {nameInitials(f.club_b?.name ?? "B")}
                      </div>
                      <p className="text-[13px] font-medium text-white truncate">
                        {f.club_b?.name ?? "TBA"}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 ${statusPill[f.status] ?? "bg-cobalt/15 text-cobalt"}`}>
                        {statusLabel[f.status] ?? f.status}
                      </span>
                      {f.scheduled_at && (
                        <span className="text-[11px] text-dim w-14 text-right">
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
