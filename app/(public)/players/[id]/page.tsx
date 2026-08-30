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

const FIXTURE_STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  reported:  "Reported",
  confirmed: "Confirmed",
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <Link
        href="/players"
        className="inline-flex items-center gap-1.5 text-sm text-dim hover:text-white transition-colors mb-8"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All players
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-10">
        {p.profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.profile_picture_url}
            alt={p.gamer_tag}
            className="w-20 h-20 rounded-full object-cover border border-rim shrink-0"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 text-navy text-2xl font-bold"
            style={{ backgroundColor: avatarColor(p.gamer_tag) }}
          >
            {nameInitials(p.gamer_tag)}
          </div>
        )}
        <div>
          {p.club && (
            <Link
              href={`/clubs/${p.club.slug}`}
              className="text-cobalt text-xs font-bold uppercase tracking-[0.2em] mb-1 hover:text-gold transition-colors block"
            >
              {p.club.name}
            </Link>
          )}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white uppercase leading-tight">{p.gamer_tag}</h1>
          {p.full_name && (
            <p className="text-dim text-sm mt-0.5">{p.full_name}</p>
          )}
          {p.position && (
            <span className="mt-2 inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-cobalt/10 text-cobalt">
              {p.position}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Bio */}
          {p.bio && (
            <section className="bg-card border border-rim p-5 rounded">
              <h2 className="text-xs font-bold uppercase tracking-wider text-dim mb-3">Bio</h2>
              <p className="text-white/80 text-sm leading-relaxed">{p.bio}</p>
            </section>
          )}

          {/* Fixtures */}
          {playerFixtures.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Club Fixtures
              </h2>
              <div className="divide-y divide-rim bg-card border border-rim rounded overflow-hidden">
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
                    <div key={f.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                      <span className="hidden sm:block text-xs text-dim uppercase tracking-wider w-20 shrink-0">
                        {f.stage}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white truncate">
                            {myClub?.name ?? "TBA"}
                          </span>
                          <span className="text-dim text-xs shrink-0 font-medium">
                            {myScore !== null && opScore !== null
                              ? `${myScore} – ${opScore}`
                              : "vs"}
                          </span>
                          {opponent ? (
                            <Link
                              href={`/clubs/${opponent.slug}`}
                              className="font-semibold text-sm text-white hover:text-gold transition-colors truncate"
                            >
                              {opponent.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-dim">TBA</span>
                          )}
                        </div>
                        {f.competition && (
                          <p className="text-xs text-dim mt-0.5">{f.competition.name}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        f.status === "confirmed" ? "bg-success/10 text-success" :
                        f.status === "disputed"  ? "bg-danger/10 text-danger"   :
                        f.status === "reported"  ? "bg-gold/10 text-gold"       :
                        "bg-cobalt/10 text-cobalt"
                      }`}>
                        {FIXTURE_STATUS_LABEL[f.status]}
                      </span>
                      {f.scheduled_at && (
                        <span className="hidden md:block text-xs text-dim shrink-0">
                          {new Date(f.scheduled_at).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Stats */}
          <section className="bg-card border border-rim p-5 rounded">
            <h2 className="text-xs font-bold uppercase tracking-wider text-dim mb-4">Season Stats</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-panel border border-rim p-3 text-center rounded">
                <p className="font-display text-3xl font-bold text-gold">{p.stats.wins}</p>
                <p className="text-xs text-dim mt-0.5">Wins</p>
              </div>
              <div className="bg-panel border border-rim p-3 text-center rounded">
                <p className="font-display text-3xl font-bold text-white">{p.stats.losses}</p>
                <p className="text-xs text-dim mt-0.5">Losses</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dim">Matches played</span>
                <span className="text-sm font-bold text-white">{p.stats.matches_played}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dim">Win rate</span>
                <span className="text-sm font-bold text-gold">{winRate}%</span>
              </div>
            </div>
          </section>

          {/* Club info */}
          {p.club && (
            <section className="bg-card border border-rim p-5 rounded">
              <h2 className="text-xs font-bold uppercase tracking-wider text-dim mb-4">Club</h2>
              <Link href={`/clubs/${p.club.slug}`} className="group">
                <p className="font-semibold text-sm text-white group-hover:text-gold transition-colors">
                  {p.club.name}
                </p>
                <p className="text-xs text-dim mt-0.5">{p.club.faculty}</p>
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
