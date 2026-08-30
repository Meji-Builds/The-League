import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

interface FixtureDetail {
  id: string;
  stage: string;
  group_name: string;
  matchday: number;
  status: string;
  scheduled_at: string | null;
  lineup_image_a: string | null;
  lineup_image_b: string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a: { id: string; name: string; slug: string; logo_url: string | null } | null;
  club_b: { id: string; name: string; slug: string; logo_url: string | null } | null;
  competition: { id: string; name: string; slug: string } | null;
}

const AVATAR_PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

const statusPill: Record<string, string> = {
  scheduled: "bg-cobalt/10 text-cobalt",
  reported:  "bg-gold/10 text-gold",
  disputed:  "bg-danger/10 text-danger",
  confirmed: "bg-success/10 text-success",
};

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  reported:  "Reported",
  disputed:  "Disputed",
  confirmed: "Confirmed",
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

export default async function FixtureDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Try with lineup images first; fall back to core fields if columns don't exist yet
  let data: unknown = null;
  const { data: full, error } = await supabase
    .from("fixtures")
    .select(`
      id, stage, group_name, matchday, status, scheduled_at,
      lineup_image_a, lineup_image_b, confirmed_score,
      club_a:clubs!fixtures_club_a_id_fkey(id, name, slug, logo_url),
      club_b:clubs!fixtures_club_b_id_fkey(id, name, slug, logo_url),
      competition:competitions(id, name, slug)
    `)
    .eq("id", id)
    .single();

  if (error) {
    const { data: core } = await supabase
      .from("fixtures")
      .select(`
        id, stage, group_name, matchday, status, scheduled_at, confirmed_score,
        club_a:clubs!fixtures_club_a_id_fkey(id, name, slug, logo_url),
        club_b:clubs!fixtures_club_b_id_fkey(id, name, slug, logo_url),
        competition:competitions(id, name, slug)
      `)
      .eq("id", id)
      .single();
    data = core;
  } else {
    data = full;
  }

  if (!data) notFound();
  const f = data as unknown as FixtureDetail;

  const colorA = AVATAR_PALETTE[(f.club_a?.name.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];
  const colorB = AVATAR_PALETTE[(f.club_b?.name.charCodeAt(0) ?? 3) % AVATAR_PALETTE.length];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/fixtures"
        className="inline-flex items-center gap-1.5 text-sm text-dim hover:text-white transition-colors mb-8"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All Fixtures
      </Link>

      {/* Header card */}
      <div className="bg-card border border-rim p-6 mb-6 rounded">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold">
              {f.competition?.name}
            </p>
            <p className="text-xs text-dim">
              {f.stage !== "N/A" ? f.stage : f.group_name}
              {f.matchday ? ` · Day ${f.matchday}` : ""}
            </p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusPill[f.status] ?? "bg-cobalt/10 text-cobalt"}`}>
            {statusLabel[f.status] ?? f.status}
          </span>
        </div>

        {/* Scoreline */}
        <div className="flex items-center gap-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-14 h-14 rounded flex items-center justify-center text-navy font-bold text-sm"
              style={{ backgroundColor: colorA }}
            >
              {initials(f.club_a?.name ?? "A")}
            </div>
            <p className="text-sm font-semibold text-white text-center leading-snug">
              {f.club_a?.name ?? "TBC"}
            </p>
          </div>

          <div className="text-center shrink-0">
            {f.confirmed_score ? (
              <p className="font-display text-5xl font-bold text-gold tabular-nums leading-none">
                {f.confirmed_score.score_a}&nbsp;&ndash;&nbsp;{f.confirmed_score.score_b}
              </p>
            ) : (
              <p className="font-display text-2xl font-bold text-dim tracking-widest">VS</p>
            )}
            {f.scheduled_at && (
              <p className="text-xs text-dim mt-2">
                {new Date(f.scheduled_at).toLocaleDateString("en-GB", {
                  weekday: "short", day: "numeric", month: "short", year: "numeric",
                })}
                {" · "}
                {new Date(f.scheduled_at).toLocaleTimeString("en-GB", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-14 h-14 rounded flex items-center justify-center text-navy font-bold text-sm"
              style={{ backgroundColor: colorB }}
            >
              {initials(f.club_b?.name ?? "B")}
            </div>
            <p className="text-sm font-semibold text-white text-center leading-snug">
              {f.club_b?.name ?? "TBC"}
            </p>
          </div>
        </div>
      </div>

      {/* Lineup Graphics */}
      {(f.lineup_image_a || f.lineup_image_b) && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-3">Lineup Graphics</h2>
          <div className={`grid gap-4 ${f.lineup_image_a && f.lineup_image_b ? "sm:grid-cols-2" : "grid-cols-1"}`}>
            {f.lineup_image_a && (
              <div className="bg-card border border-rim overflow-hidden rounded">
                <p className="text-xs font-semibold text-dim px-3 pt-3 pb-1">
                  {f.club_a?.name ?? "Club A"}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.lineup_image_a}
                  alt={`${f.club_a?.name ?? "Club A"} lineup`}
                  className="w-full h-auto"
                />
              </div>
            )}
            {f.lineup_image_b && (
              <div className="bg-card border border-rim overflow-hidden rounded">
                <p className="text-xs font-semibold text-dim px-3 pt-3 pb-1">
                  {f.club_b?.name ?? "Club B"}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.lineup_image_b}
                  alt={`${f.club_b?.name ?? "Club B"} lineup`}
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {!f.lineup_image_a && !f.lineup_image_b && f.status === "scheduled" && (
        <div className="bg-card border border-rim px-6 py-8 text-center rounded">
          <p className="text-sm text-dim">Lineup graphics will appear here once uploaded by the admin.</p>
        </div>
      )}
    </div>
  );
}
