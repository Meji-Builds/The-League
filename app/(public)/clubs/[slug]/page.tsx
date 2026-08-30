import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Club, Player } from "@/types/database";

interface CompetitionEntry {
  payment_status: string;
  competition:    { id: string; name: string; slug: string; status: string } | null;
}

interface FixtureRow {
  id:              string;
  stage:           string;
  matchday:        number;
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

const COMPETITION_STATUS_LABEL: Record<string, string> = {
  upcoming:          "Upcoming",
  registration_open: "Reg. Open",
  in_progress:       "In Progress",
  completed:         "Completed",
};

const FIXTURE_STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  reported:  "Reported",
  confirmed: "Confirmed",
  disputed:  "Disputed",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).from("clubs").select("name").eq("slug", slug).single();
  return { title: data?.name ?? "Club Profile" };
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: club } = await db
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!club) notFound();

  const c = club as Club;

  const [{ data: players }, { data: entries }, { data: fixtures }] = await Promise.all([
    db.from("players")
      .select("*")
      .eq("club_id", c.id)
      .order("gamer_tag"),
    db.from("competition_entries")
      .select("payment_status, competition:competitions(id, name, slug, status)")
      .eq("club_id", c.id)
      .eq("payment_status", "paid"),
    db.from("fixtures")
      .select("id, stage, matchday, status, scheduled_at, confirmed_score, club_a:clubs!fixtures_club_a_id_fkey(id, name, slug), club_b:clubs!fixtures_club_b_id_fkey(id, name, slug), competition:competitions(name, slug)")
      .or(`club_a_id.eq.${c.id},club_b_id.eq.${c.id}`)
      .order("scheduled_at", { ascending: false })
      .limit(8),
  ]);

  const clubPlayers  = (players ?? []) as Player[];
  const clubEntries  = (entries  ?? []) as CompetitionEntry[];
  const clubFixtures = (fixtures ?? []) as FixtureRow[];

  const totalWins = clubPlayers.reduce((sum, p) => sum + (p.stats?.wins ?? 0), 0);

  const last5 = clubFixtures
    .filter((f) => f.status === "confirmed" && f.confirmed_score)
    .slice(0, 5)
    .map((f) => {
      const isA   = f.club_a?.id === c.id;
      const mine  = isA ? f.confirmed_score!.score_a : f.confirmed_score!.score_b;
      const theirs = isA ? f.confirmed_score!.score_b : f.confirmed_score!.score_a;
      return mine > theirs ? "W" : mine < theirs ? "L" : "D";
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <Link
        href="/clubs"
        className="inline-flex items-center gap-1.5 text-sm text-dim hover:text-white transition-colors mb-8"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All clubs
      </Link>

      {/* Club banner */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(club as any).banner_image_url && (
        <div className="relative w-full h-48 sm:h-64 overflow-hidden rounded mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            src={(club as any).banner_image_url}
            alt={`${c.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/20 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-5 mb-10">
        {c.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.logo_url}
            alt={`${c.name} logo`}
            className="w-16 h-16 object-contain border border-rim bg-card p-1 shrink-0 rounded"
          />
        ) : (
          <div
            className="w-16 h-16 rounded flex items-center justify-center shrink-0 text-navy text-xl font-bold"
            style={{ backgroundColor: avatarColor(c.name) }}
          >
            {nameInitials(c.name)}
          </div>
        )}
        <div>
          <p className="text-cobalt text-xs font-bold uppercase tracking-[0.2em] mb-1">
            {c.faculty}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white uppercase leading-tight">{c.name}</h1>
          <p className="text-dim text-sm mt-1">{c.department}</p>
          {last5.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-xs text-dim mr-1">Form</span>
              {last5.map((result, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white ${
                    result === "W" ? "bg-success" :
                    result === "L" ? "bg-danger"  : "bg-dim"
                  }`}
                >
                  {result}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Bio */}
          {c.bio && (
            <section className="bg-card border border-rim p-5 rounded">
              <h2 className="text-xs font-bold uppercase tracking-wider text-dim mb-3">About</h2>
              <p className="text-white/80 text-sm leading-relaxed">{c.bio}</p>
            </section>
          )}

          {/* Fixtures */}
          {clubFixtures.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Fixtures</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {clubFixtures.map((f) => {
                  const isClubA = f.club_a?.id === c.id;
                  const myScore = f.confirmed_score
                    ? (isClubA ? f.confirmed_score.score_a : f.confirmed_score.score_b)
                    : null;
                  const opScore = f.confirmed_score
                    ? (isClubA ? f.confirmed_score.score_b : f.confirmed_score.score_a)
                    : null;

                  return (
                    <div key={f.id} className="border border-rim bg-card p-4 rounded">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold truncate mr-2">
                          {f.competition?.name ?? ""}
                        </span>
                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          f.status === "confirmed" ? "bg-success/10 text-success" :
                          f.status === "disputed"  ? "bg-danger/10 text-danger"   :
                          f.status === "reported"  ? "bg-gold/10 text-gold"       :
                          "bg-cobalt/10 text-cobalt"
                        }`}>
                          {FIXTURE_STATUS_LABEL[f.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded flex items-center justify-center text-navy text-xs font-bold"
                            style={{ backgroundColor: avatarColor(c.name) }}
                          >
                            {nameInitials(c.name)}
                          </div>
                          <p className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">
                            {c.name}
                          </p>
                        </div>
                        <div className="text-center px-1 shrink-0">
                          {myScore !== null && opScore !== null ? (
                            <p className="font-display text-xl font-bold text-white tabular-nums leading-none">
                              {myScore}&nbsp;&ndash;&nbsp;{opScore}
                            </p>
                          ) : (
                            <p className="text-xs font-bold text-dim tracking-widest">VS</p>
                          )}
                          {f.scheduled_at && (
                            <p className="text-[10px] text-dim mt-1">
                              {new Date(f.scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </p>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                          {isClubA ? (
                            f.club_b ? (
                              <Link href={`/clubs/${f.club_b.slug}`} className="flex flex-col items-center gap-1.5 group">
                                <div
                                  className="w-10 h-10 rounded flex items-center justify-center text-navy text-xs font-bold"
                                  style={{ backgroundColor: avatarColor(f.club_b.name) }}
                                >
                                  {nameInitials(f.club_b.name)}
                                </div>
                                <p className="text-xs font-semibold text-white text-center leading-tight line-clamp-2 group-hover:text-gold transition-colors">
                                  {f.club_b.name}
                                </p>
                              </Link>
                            ) : <span className="text-xs text-dim">TBA</span>
                          ) : (
                            f.club_a ? (
                              <Link href={`/clubs/${f.club_a.slug}`} className="flex flex-col items-center gap-1.5 group">
                                <div
                                  className="w-10 h-10 rounded flex items-center justify-center text-navy text-xs font-bold"
                                  style={{ backgroundColor: avatarColor(f.club_a.name) }}
                                >
                                  {nameInitials(f.club_a.name)}
                                </div>
                                <p className="text-xs font-semibold text-white text-center leading-tight line-clamp-2 group-hover:text-gold transition-colors">
                                  {f.club_a.name}
                                </p>
                              </Link>
                            ) : <span className="text-xs text-dim">TBA</span>
                          )}
                        </div>
                      </div>
                      {f.stage && (
                        <p className="text-[10px] text-dim text-center mt-2 uppercase tracking-wider">{f.stage}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Squad */}
          {clubPlayers.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Squad ({clubPlayers.length})
              </h2>
              <div className="divide-y divide-rim bg-card border border-rim rounded overflow-hidden">
                {clubPlayers.map((p) => (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                    {p.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.profile_picture_url}
                        alt={p.gamer_tag}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-navy text-xs font-bold"
                        style={{ backgroundColor: avatarColor(p.gamer_tag) }}
                      >
                        {nameInitials(p.gamer_tag)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{p.gamer_tag}</p>
                      {p.position && (
                        <p className="text-xs text-dim">{p.position}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <p className="text-sm font-bold text-white">{p.stats.wins}</p>
                        <p className="text-xs text-dim">W</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{p.stats.losses}</p>
                        <p className="text-xs text-dim">L</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{p.stats.matches_played}</p>
                        <p className="text-xs text-dim">MP</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Stats */}
          <section className="bg-card border border-rim p-5 rounded">
            <h2 className="text-xs font-bold uppercase tracking-wider text-dim mb-4">Club Stats</h2>
            <div className="space-y-3">
              {[
                { label: "Players",      value: clubPlayers.length },
                { label: "Competitions", value: clubEntries.length },
                { label: "Total Wins",   value: totalWins },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-dim">{label}</span>
                  <span className="font-display text-lg font-bold text-gold">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Competitions */}
          {clubEntries.length > 0 && (
            <section className="bg-card border border-rim p-5 rounded">
              <h2 className="text-xs font-bold uppercase tracking-wider text-dim mb-4">Competitions</h2>
              <div className="space-y-2">
                {clubEntries.map((entry, i) =>
                  entry.competition ? (
                    <Link
                      key={i}
                      href={`/competitions/${entry.competition.slug}`}
                      className="block group"
                    >
                      <p className="text-sm font-semibold text-white group-hover:text-gold transition-colors leading-snug">
                        {entry.competition.name}
                      </p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                        entry.competition.status === "in_progress"
                          ? "bg-success/10 text-success"
                          : "bg-cobalt/10 text-cobalt"
                      }`}>
                        {COMPETITION_STATUS_LABEL[entry.competition.status] ?? entry.competition.status}
                      </span>
                    </Link>
                  ) : null
                )}
              </div>
            </section>
          )}

          {/* Club sponsors */}
          {c.sponsors?.length > 0 && (
            <section className="bg-card border border-rim p-5 rounded">
              <h2 className="text-xs font-bold uppercase tracking-wider text-dim mb-4">Sponsors</h2>
              <div className="space-y-2">
                {c.sponsors.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {s.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logo_url} alt={s.name} className="h-6 object-contain brightness-0 invert" />
                    )}
                    <span className="text-sm text-white">{s.name}</span>
                    {s.tier && (
                      <span className="text-xs text-dim ml-auto capitalize">{s.tier}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
