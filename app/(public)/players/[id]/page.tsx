import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/types/database";

interface PlayerWithClub extends Player {
  club: { id: string; name: string; slug: string; faculty: string } | null;
}

interface FixtureRow {
  id:              string;
  stage:           string;
  status:          string;
  scheduled_at:    string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a:          { id: string; name: string; slug: string } | null;
  club_b:          { id: string; name: string; slug: string } | null;
  competition:     { name: string; slug: string } | null;
}

const AVATAR_PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

function avatarColor(name: string): string {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function nameInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-cobalt",
  reported:  "bg-gold",
  disputed:  "bg-danger",
  confirmed: "bg-success",
};

const FIXTURE_STATUS_LABEL: Record<string, string> = {
  scheduled: "Upcoming",
  reported:  "Reported",
  confirmed: "FT",
  disputed:  "Disputed",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("players").select("gamer_tag").eq("id", id).single();
  return { title: data?.gamer_tag ?? "Player Profile" };
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: player } = await db
    .from("players")
    .select("*, club:clubs!players_club_id_fkey(id, name, slug, faculty)")
    .eq("id", id)
    .single();

  if (!player) notFound();

  const p = player as PlayerWithClub;

  const { data: fixtures } = await db
    .from("fixtures")
    .select("id, stage, status, scheduled_at, confirmed_score, club_a:clubs!fixtures_club_a_id_fkey(id, name, slug), club_b:clubs!fixtures_club_b_id_fkey(id, name, slug), competition:competitions(name, slug)")
    .or(`club_a_id.eq.${p.club_id},club_b_id.eq.${p.club_id}`)
    .order("scheduled_at", { ascending: false })
    .limit(8);

  const playerFixtures = (fixtures ?? []) as FixtureRow[];

  const winRate = p.stats.matches_played > 0
    ? Math.round((p.stats.wins / p.stats.matches_played) * 100)
    : 0;

  const playerColor = avatarColor(p.gamer_tag);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      <Link
        href="/players"
        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors mb-12"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All players
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-14">
        {p.profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.profile_picture_url}
            alt={p.gamer_tag}
            className="w-16 h-16 object-cover shrink-0"
          />
        ) : (
          <div
            className="w-16 h-16 flex items-center justify-center shrink-0 text-navy text-xl font-black"
            style={{ backgroundColor: playerColor }}
          >
            {nameInitials(p.gamer_tag)}
          </div>
        )}
        <div>
          {p.club && (
            <Link
              href={`/clubs/${p.club.slug}`}
              className="text-[9px] font-bold uppercase tracking-[0.5em] text-cobalt hover:text-white transition-colors block mb-2"
            >
              {p.club.name}
            </Link>
          )}
          <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">
            {p.gamer_tag}
          </h1>
          {p.full_name && (
            <p className="text-white/30 text-[13px] mt-1.5">{p.full_name}</p>
          )}
          {p.position && (
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/25 mt-2">{p.position}</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-14">

          {/* Bio */}
          {p.bio && (
            <section className="bg-card border border-white/6 p-7">
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Bio</p>
              <p className="text-white/60 text-[14px] leading-relaxed">{p.bio}</p>
            </section>
          )}

          {/* Club Fixtures */}
          {playerFixtures.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim">Club Fixtures</p>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="border border-white/6 divide-y divide-white/5 overflow-hidden">
                {playerFixtures.map((f) => {
                  const clubIsA  = f.club_a?.id === p.club_id;
                  const myClub   = clubIsA ? f.club_a : f.club_b;
                  const opponent = clubIsA ? f.club_b : f.club_a;
                  const myScore  = f.confirmed_score
                    ? (clubIsA ? f.confirmed_score.score_a : f.confirmed_score.score_b)
                    : null;
                  const opScore  = f.confirmed_score
                    ? (clubIsA ? f.confirmed_score.score_b : f.confirmed_score.score_a)
                    : null;

                  return (
                    <Link
                      key={f.id}
                      href={`/fixtures/${f.id}`}
                      className="flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors group overflow-hidden"
                    >
                      {/* My club */}
                      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <p className="text-[13px] text-white/70 group-hover:text-white transition-colors truncate text-right">
                          {myClub?.name ?? "TBA"}
                        </p>
                        <div
                          className="w-6 h-6 shrink-0 flex items-center justify-center text-navy text-[9px] font-black"
                          style={{ backgroundColor: playerColor }}
                        >
                          {nameInitials(myClub?.name ?? "?")}
                        </div>
                      </div>

                      {/* Score / VS */}
                      <div className="w-16 text-center shrink-0">
                        {myScore !== null && opScore !== null ? (
                          <span className={`font-display font-black text-lg tabular-nums leading-none ${
                            myScore > opScore ? "text-success" : myScore < opScore ? "text-danger" : "text-white/50"
                          }`}>
                            {myScore}&nbsp;&ndash;&nbsp;{opScore}
                          </span>
                        ) : (
                          <span className="text-[11px] text-white/15 font-bold tracking-[0.3em]">vs</span>
                        )}
                      </div>

                      {/* Opponent */}
                      <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                        {opponent ? (
                          <>
                            <div
                              className="w-6 h-6 shrink-0 flex items-center justify-center text-navy text-[9px] font-black"
                              style={{ backgroundColor: avatarColor(opponent.name) }}
                            >
                              {nameInitials(opponent.name)}
                            </div>
                            <p className="text-[13px] text-white/70 group-hover:text-white transition-colors truncate">
                              {opponent.name}
                            </p>
                          </>
                        ) : (
                          <p className="text-[13px] text-white/20">TBA</p>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="hidden sm:flex items-center gap-3 shrink-0">
                        {f.competition?.name && (
                          <span className="text-[11px] text-white/20 truncate max-w-[90px]">{f.competition.name}</span>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[f.status] ?? "bg-cobalt"}`} />
                          <span className="text-[11px] text-white/30">{FIXTURE_STATUS_LABEL[f.status] ?? f.status}</span>
                        </div>
                        {f.scheduled_at && (
                          <span className="text-[11px] text-white/20 tabular-nums">
                            {new Date(f.scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-8">

          {/* Season stats */}
          <section className="bg-card border border-white/6 p-7">
            <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-6">Season Stats</p>
            <div className="grid grid-cols-2 gap-px bg-white/5 mb-6">
              <div className="bg-card p-5 text-center">
                <p className="font-display font-black text-4xl text-gold tabular-nums leading-none">{p.stats.wins}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-dim mt-2">Wins</p>
              </div>
              <div className="bg-card p-5 text-center">
                <p className="font-display font-black text-4xl text-white tabular-nums leading-none">{p.stats.losses}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-dim mt-2">Losses</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[13px] text-white/40">Matches played</span>
                <span className="font-display font-black text-lg text-white">{p.stats.matches_played}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/40">Win rate</span>
                <span className="font-display font-black text-lg text-gold">{winRate}%</span>
              </div>
            </div>
          </section>

          {/* Club info */}
          {p.club && (
            <section>
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Club</p>
              <Link
                href={`/clubs/${p.club.slug}`}
                className="flex items-center gap-3 bg-card border border-white/6 px-5 py-4 hover:bg-white/[0.03] transition-colors group"
              >
                <div
                  className="w-8 h-8 flex items-center justify-center text-navy text-[10px] font-black shrink-0"
                  style={{ backgroundColor: avatarColor(p.club.name) }}
                >
                  {nameInitials(p.club.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[13px] text-white/80 group-hover:text-white transition-colors truncate">
                    {p.club.name}
                  </p>
                  <p className="text-[11px] text-white/25">{p.club.faculty}</p>
                </div>
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
