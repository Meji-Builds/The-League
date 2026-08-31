import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Club, Player } from "@/types/database";

interface CompetitionEntry {
  payment_status: string;
  competition:    { id: string; name: string; slug: string; status: string } | null;
}

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
  matchday:        number;
  status:          string;
  scheduled_at:    string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a:          ClubRef | null;
  club_b:          ClubRef | null;
  competition:     { name: string; slug: string } | null;
}

const AVATAR_PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

function avatarColor(name: string): string {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function nameInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function ClubAvatar({ club, size = 7 }: { club: { name: string; logo_url?: string | null; logo_status?: string | null } | null; size?: number }) {
  const name    = club?.name ?? "?";
  const color   = avatarColor(name);
  const hasLogo = club?.logo_url && club.logo_status === "approved";
  const sz      = size === 6 ? "w-6 h-6" : size === 7 ? "w-7 h-7" : size === 8 ? "w-8 h-8" : "w-7 h-7";
  return (
    <div className={`${sz} shrink-0 flex items-center justify-center overflow-hidden text-navy text-[9px] font-black`} style={{ backgroundColor: hasLogo ? undefined : color }}>
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={club!.logo_url!} alt={name} className="w-full h-full object-contain p-0.5" />
      ) : nameInitials(name)}
    </div>
  );
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

const COMP_STATUS_TEXT: Record<string, string> = {
  in_progress:       "text-success",
  registration_open: "text-gold",
  upcoming:          "text-cobalt",
  completed:         "text-white/25",
};

const COMP_STATUS_LABEL: Record<string, string> = {
  upcoming:          "Upcoming",
  registration_open: "Reg. Open",
  in_progress:       "In Progress",
  completed:         "Completed",
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
      .select("id, stage, matchday, status, scheduled_at, confirmed_score, club_a:clubs!fixtures_club_a_id_fkey(id, name, slug, logo_url, logo_status), club_b:clubs!fixtures_club_b_id_fkey(id, name, slug, logo_url, logo_status), competition:competitions(name, slug)")
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
      const isA    = f.club_a?.id === c.id;
      const mine   = isA ? f.confirmed_score!.score_a : f.confirmed_score!.score_b;
      const theirs = isA ? f.confirmed_score!.score_b : f.confirmed_score!.score_a;
      return mine > theirs ? "W" : mine < theirs ? "L" : "D";
    });

  const clubColor = avatarColor(c.name);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      <Link
        href="/clubs"
        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors mb-12"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All clubs
      </Link>

      {/* Club banner */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(club as any).banner_image_url && (
        <div className="relative w-full h-48 sm:h-56 overflow-hidden mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            src={(club as any).banner_image_url}
            alt={`${c.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
        </div>
      )}

      {/* Club header */}
      <div className="flex items-start gap-5 mb-14">
        {c.logo_url && c.logo_status === "approved" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.logo_url}
            alt={`${c.name} logo`}
            className="w-16 h-16 object-contain border border-white/10 bg-card p-1 shrink-0"
          />
        ) : (
          <div
            className="w-16 h-16 flex items-center justify-center shrink-0 text-navy text-2xl font-black"
            style={{ backgroundColor: clubColor }}
          >
            {nameInitials(c.name)}
          </div>
        )}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-cobalt mb-2">{c.faculty}</p>
          <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">{c.name}</h1>
          {c.department && (
            <p className="text-white/30 text-[13px] mt-1.5">{c.department}</p>
          )}
          {last5.length > 0 && (
            <div className="flex items-center gap-1.5 mt-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-dim mr-1">Form</span>
              {last5.map((result, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 flex items-center justify-center text-[9px] font-black text-navy ${
                    result === "W" ? "bg-success" :
                    result === "L" ? "bg-danger"  : "bg-white/20"
                  }`}
                >
                  {result}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-14">

          {/* Bio */}
          {c.bio && (
            <section className="bg-card border border-white/6 p-7">
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">About</p>
              <p className="text-white/60 text-[14px] leading-relaxed">{c.bio}</p>
            </section>
          )}

          {/* Fixtures */}
          {clubFixtures.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim">Fixtures</p>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="border border-white/6 divide-y divide-white/5 overflow-hidden">
                {clubFixtures.map((f) => {
                  const isClubA = f.club_a?.id === c.id;
                  const opponent = isClubA ? f.club_b : f.club_a;
                  const myScore  = f.confirmed_score ? (isClubA ? f.confirmed_score.score_a : f.confirmed_score.score_b) : null;
                  const opScore  = f.confirmed_score ? (isClubA ? f.confirmed_score.score_b : f.confirmed_score.score_a) : null;

                  return (
                    <Link
                      key={f.id}
                      href={`/fixtures/${f.id}`}
                      className="flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors group overflow-hidden"
                    >
                      {/* This club */}
                      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <p className="hidden sm:block text-[13px] text-white/70 group-hover:text-white transition-colors truncate text-right">{c.name}</p>
                        <ClubAvatar club={{ name: c.name, logo_url: c.logo_url, logo_status: c.logo_status }} size={6} />
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
                            <ClubAvatar club={opponent} size={6} />
                            <p className="hidden sm:block text-[13px] text-white/70 group-hover:text-white transition-colors truncate">
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
                          <span className="text-[11px] text-white/20 truncate max-w-[100px]">{f.competition.name}</span>
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

          {/* Squad */}
          {clubPlayers.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim">
                  Squad ({clubPlayers.length})
                </p>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="border border-white/6 divide-y divide-white/5">
                {clubPlayers.map((p) => (
                  <div key={p.id} className="px-5 py-3.5 flex items-center gap-3">
                    {p.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.profile_picture_url}
                        alt={p.gamer_tag}
                        className="w-8 h-8 object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 flex items-center justify-center shrink-0 text-navy text-[10px] font-black"
                        style={{ backgroundColor: avatarColor(p.gamer_tag) }}
                      >
                        {nameInitials(p.gamer_tag)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[13px] text-white truncate">{p.gamer_tag}</p>
                      {p.position && (
                        <p className="text-[11px] text-white/30">{p.position}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-5 text-right shrink-0">
                      <div>
                        <p className="font-display font-black text-base text-white">{p.stats.wins}</p>
                        <p className="text-[9px] text-white/25 uppercase tracking-wider">W</p>
                      </div>
                      <div>
                        <p className="font-display font-black text-base text-white">{p.stats.losses}</p>
                        <p className="text-[9px] text-white/25 uppercase tracking-wider">L</p>
                      </div>
                      <div>
                        <p className="font-display font-black text-base text-white">{p.stats.matches_played}</p>
                        <p className="text-[9px] text-white/25 uppercase tracking-wider">MP</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-8">

          {/* Club stats */}
          <section className="bg-card border border-white/6 p-7">
            <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-6">Club Stats</p>
            <div className="space-y-5">
              {[
                { label: "Players",      value: clubPlayers.length },
                { label: "Competitions", value: clubEntries.length },
                { label: "Total Wins",   value: totalWins },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between border-b border-white/5 pb-5 last:border-0 last:pb-0">
                  <span className="text-[13px] text-white/40">{label}</span>
                  <span className="font-display font-black text-2xl text-white">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Competitions */}
          {clubEntries.length > 0 && (
            <section>
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Competitions</p>
              <div className="border border-white/6 divide-y divide-white/5">
                {clubEntries.map((entry, i) =>
                  entry.competition ? (
                    <Link
                      key={i}
                      href={`/competitions/${entry.competition.slug}`}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-colors group"
                    >
                      <p className="font-medium text-[13px] text-white/80 group-hover:text-white transition-colors leading-snug truncate mr-3">
                        {entry.competition.name}
                      </p>
                      <span className={`text-[9px] font-bold uppercase tracking-[0.15em] shrink-0 ${COMP_STATUS_TEXT[entry.competition.status] ?? "text-white/25"}`}>
                        {COMP_STATUS_LABEL[entry.competition.status] ?? entry.competition.status}
                      </span>
                    </Link>
                  ) : null
                )}
              </div>
            </section>
          )}

          {/* Club sponsors */}
          {c.sponsors?.length > 0 && (
            <section>
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Sponsors</p>
              <div className="border border-white/6 divide-y divide-white/5">
                {c.sponsors.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    {s.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logo_url} alt={s.name} className="h-5 object-contain brightness-0 invert opacity-60" />
                    )}
                    <span className="text-[13px] text-white/60">{s.name}</span>
                    {s.tier && (
                      <span className="text-[9px] text-white/25 ml-auto uppercase tracking-wider">{s.tier}</span>
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
