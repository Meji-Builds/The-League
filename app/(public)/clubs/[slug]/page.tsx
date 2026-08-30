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

const AVATAR_PALETTE = ["#2D4A7C", "#C9A227", "#2D7A4F", "#B91C1C", "#7C2D96", "#0369A1"];

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Back */}
      <Link href="/clubs" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy transition-colors mb-8">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All clubs
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-10">
        {c.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.logo_url}
            alt={`${c.name} logo`}
            className="w-16 h-16 object-contain border border-border bg-white p-1 shrink-0"
          />
        ) : (
          <div
            className="w-16 h-16 rounded flex items-center justify-center shrink-0 text-white text-xl font-bold"
            style={{ backgroundColor: avatarColor(c.name) }}
          >
            {nameInitials(c.name)}
          </div>
        )}
        <div>
          <p className="text-cobalt text-xs font-semibold uppercase tracking-[0.2em] mb-1">
            {c.faculty}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy leading-tight">{c.name}</h1>
          <p className="text-muted text-sm mt-1">{c.department}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Bio */}
          {c.bio && (
            <section className="bg-white border border-border p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">About</h2>
              <p className="text-navy text-sm leading-relaxed">{c.bio}</p>
            </section>
          )}

          {/* Fixtures */}
          {clubFixtures.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Fixtures</h2>
              <div className="divide-y divide-border bg-white border border-border">
                {clubFixtures.map((f) => {
                  const isClubA  = f.club_a?.id === c.id;
                  const opponent = isClubA ? f.club_b : f.club_a;
                  const myScore  = f.confirmed_score
                    ? (isClubA ? f.confirmed_score.score_a : f.confirmed_score.score_b)
                    : null;
                  const opScore  = f.confirmed_score
                    ? (isClubA ? f.confirmed_score.score_b : f.confirmed_score.score_a)
                    : null;

                  return (
                    <div key={f.id} className="px-4 py-3 flex items-center gap-3">
                      <span className="hidden sm:block text-xs text-muted uppercase tracking-wider w-20 shrink-0">
                        {f.stage}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-navy truncate">{c.name}</span>
                          <span className="text-muted text-xs shrink-0">
                            {myScore !== null && opScore !== null
                              ? `${myScore} – ${opScore}`
                              : "vs"}
                          </span>
                          {opponent ? (
                            <Link
                              href={`/clubs/${opponent.slug}`}
                              className="font-semibold text-sm text-navy hover:text-cobalt transition-colors truncate"
                            >
                              {opponent.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted">TBA</span>
                          )}
                        </div>
                        {f.competition && (
                          <p className="text-xs text-muted mt-0.5">{f.competition.name}</p>
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
                        <span className="hidden md:block text-xs text-muted shrink-0">
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

          {/* Players */}
          {clubPlayers.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">
                Squad ({clubPlayers.length})
              </h2>
              <div className="divide-y divide-border bg-white border border-border">
                {clubPlayers.map((p) => (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                    {p.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.profile_picture_url}
                        alt={p.gamer_tag}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                        style={{ backgroundColor: avatarColor(p.gamer_tag) }}
                      >
                        {nameInitials(p.gamer_tag)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-navy truncate">{p.gamer_tag}</p>
                      {p.position && (
                        <p className="text-xs text-muted">{p.position}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <p className="text-sm font-bold text-navy">{p.stats.wins}</p>
                        <p className="text-xs text-muted">W</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy">{p.stats.losses}</p>
                        <p className="text-xs text-muted">L</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy">{p.stats.matches_played}</p>
                        <p className="text-xs text-muted">MP</p>
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
          <section className="bg-white border border-border p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Club Stats</h2>
            <div className="space-y-3">
              {[
                { label: "Players",      value: clubPlayers.length },
                { label: "Competitions", value: clubEntries.length },
                { label: "Total Wins",   value: totalWins },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-muted">{label}</span>
                  <span className="text-sm font-bold text-navy">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Competitions */}
          {clubEntries.length > 0 && (
            <section className="bg-white border border-border p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Competitions</h2>
              <div className="space-y-2">
                {clubEntries.map((entry, i) =>
                  entry.competition ? (
                    <Link
                      key={i}
                      href={`/competitions/${entry.competition.slug}`}
                      className="block group"
                    >
                      <p className="text-sm font-semibold text-navy group-hover:text-cobalt transition-colors leading-snug">
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
            <section className="bg-white border border-border p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Club Sponsors</h2>
              <div className="space-y-2">
                {c.sponsors.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {s.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logo_url} alt={s.name} className="h-6 object-contain" />
                    )}
                    <span className="text-sm text-navy">{s.name}</span>
                    {s.tier && (
                      <span className="text-xs text-muted ml-auto capitalize">{s.tier}</span>
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
