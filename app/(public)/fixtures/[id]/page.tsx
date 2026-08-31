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

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-cobalt",
  reported:  "bg-gold",
  disputed:  "bg-danger",
  confirmed: "bg-success",
};

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  reported:  "Reported",
  disputed:  "Disputed",
  confirmed: "Full Time",
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

export default async function FixtureDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

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

  const colorA = avatarColor(f.club_a?.name ?? "A");
  const colorB = avatarColor(f.club_b?.name ?? "B");

  const stageLabel = [
    f.competition?.name,
    f.stage && f.stage !== "N/A" ? f.stage : f.group_name || null,
    f.matchday ? `Day ${f.matchday}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Link
        href="/fixtures"
        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors mb-12"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All Fixtures
      </Link>

      {/* Match header */}
      <div className="bg-card border border-white/6 mb-1">
        {/* Meta bar */}
        <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center justify-between gap-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim truncate">{stageLabel}</p>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[f.status] ?? "bg-cobalt"}`} />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
              {statusLabel[f.status] ?? f.status}
            </span>
          </div>
        </div>

        {/* Scoreline */}
        <div className="px-6 py-10 flex items-center gap-6">
          {/* Club A */}
          <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
            <div
              className="w-16 h-16 flex items-center justify-center text-navy font-black text-lg"
              style={{ backgroundColor: colorA }}
            >
              {initials(f.club_a?.name ?? "A")}
            </div>
            <Link
              href={f.club_a?.slug ? `/clubs/${f.club_a.slug}` : "#"}
              className="font-display font-black text-lg text-white uppercase text-center leading-tight hover:text-gold transition-colors line-clamp-2"
            >
              {f.club_a?.name ?? "TBC"}
            </Link>
          </div>

          {/* Score / VS */}
          <div className="text-center shrink-0 min-w-[100px]">
            {f.confirmed_score ? (
              <p className="font-display font-black text-gold tabular-nums leading-none" style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)" }}>
                {f.confirmed_score.score_a}&nbsp;&ndash;&nbsp;{f.confirmed_score.score_b}
              </p>
            ) : (
              <p className="font-display font-black text-white/15 tracking-[0.4em] text-2xl">VS</p>
            )}
            {f.scheduled_at && (
              <p className="text-[11px] text-white/25 mt-3 tabular-nums">
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

          {/* Club B */}
          <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
            <div
              className="w-16 h-16 flex items-center justify-center text-navy font-black text-lg"
              style={{ backgroundColor: colorB }}
            >
              {initials(f.club_b?.name ?? "B")}
            </div>
            <Link
              href={f.club_b?.slug ? `/clubs/${f.club_b.slug}` : "#"}
              className="font-display font-black text-lg text-white uppercase text-center leading-tight hover:text-gold transition-colors line-clamp-2"
            >
              {f.club_b?.name ?? "TBC"}
            </Link>
          </div>
        </div>
      </div>

      {/* Lineup Graphics */}
      {(f.lineup_image_a || f.lineup_image_b) && (
        <div className="mt-10">
          <div className="flex items-center gap-4 mb-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim">Lineup Graphics</p>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className={`grid gap-px bg-white/5 border border-white/5 ${f.lineup_image_a && f.lineup_image_b ? "sm:grid-cols-2" : "grid-cols-1"}`}>
            {f.lineup_image_a && (
              <div className="bg-card overflow-hidden">
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-dim px-5 pt-4 pb-3">
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
              <div className="bg-card overflow-hidden">
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-dim px-5 pt-4 pb-3">
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
        <div className="mt-10 border border-white/6 bg-card px-6 py-10 text-center">
          <p className="text-[13px] text-white/20">Lineup graphics will appear here once uploaded.</p>
        </div>
      )}
    </div>
  );
}
