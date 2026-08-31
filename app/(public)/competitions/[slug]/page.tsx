import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface ClubRef {
  id?: string;
  name: string;
  slug?: string;
  logo_url: string | null;
  logo_status: string | null;
}

interface Fixture {
  id: string;
  stage: string;
  group_name: string;
  matchday: number;
  status: string;
  scheduled_at: string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a: (ClubRef & { id: string; slug: string }) | null;
  club_b: (ClubRef & { id: string; slug: string }) | null;
}

interface EnteredClub {
  club: (ClubRef & { id: string; slug: string; faculty: string }) | null;
  payment_status: string;
}

interface StandingRow {
  club_id:     string;
  name:        string;
  slug:        string;
  logo_url:    string | null;
  logo_status: string | null;
  P:  number;
  W:  number;
  L:  number;
  GF: number;
  GA: number;
  Pts: number;
}

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

const COMP_STATUS_ACCENT: Record<string, string> = {
  in_progress:       "border-l-success",
  registration_open: "border-l-gold",
  upcoming:          "border-l-cobalt",
  completed:         "border-l-white/20",
};

const COMP_STATUS_LABEL: Record<string, string> = {
  upcoming:          "Upcoming",
  registration_open: "Reg. Open",
  in_progress:       "In Progress",
  completed:         "Completed",
};

const COMP_STATUS_TEXT: Record<string, string> = {
  in_progress:       "text-success",
  registration_open: "text-gold",
  upcoming:          "text-cobalt",
  completed:         "text-white/30",
};

const AVATAR_PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

function avatarColor(name: string): string {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function nameInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function ClubAvatar({ club, size = 7 }: { club: ClubRef | null; size?: number }) {
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

function buildStandings(fixtures: Fixture[]): StandingRow[] {
  const map = new Map<string, StandingRow>();

  function ensure(club: { id: string; name: string; slug: string; logo_url?: string | null; logo_status?: string | null }) {
    if (!map.has(club.id)) {
      map.set(club.id, { club_id: club.id, name: club.name, slug: club.slug, logo_url: club.logo_url ?? null, logo_status: club.logo_status ?? null, P: 0, W: 0, L: 0, GF: 0, GA: 0, Pts: 0 });
    }
    return map.get(club.id)!;
  }

  for (const f of fixtures) {
    if (f.status !== "confirmed" || !f.confirmed_score || !f.club_a || !f.club_b) continue;
    const a = ensure(f.club_a);
    const b = ensure(f.club_b);
    const { score_a, score_b } = f.confirmed_score;

    a.P++; b.P++;
    a.GF += score_a; a.GA += score_b;
    b.GF += score_b; b.GA += score_a;

    if (score_a > score_b)       { a.W++; a.Pts += 3; b.L++; }
    else if (score_b > score_a)  { b.W++; b.Pts += 3; a.L++; }
    else                          { a.Pts += 1; b.Pts += 1; }
  }

  return [...map.values()].sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    return (b.GF - b.GA) - (a.GF - a.GA);
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).from("competitions").select("name").eq("slug", slug).single();
  return { title: data?.name ?? "Competition" };
}

export default async function CompetitionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: competition } = await db
    .from("competitions")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!competition) notFound();

  const [{ data: rawFixtures }, { data: rawEntries }] = await Promise.all([
    db.from("fixtures")
      .select(`
        id, stage, group_name, matchday, status, scheduled_at, confirmed_score,
        club_a:clubs!fixtures_club_a_id_fkey(id, name, slug, logo_url, logo_status),
        club_b:clubs!fixtures_club_b_id_fkey(id, name, slug, logo_url, logo_status)
      `)
      .eq("competition_id", competition.id)
      .order("matchday")
      .order("scheduled_at"),
    db.from("competition_entries")
      .select("payment_status, club:clubs(id, name, slug, faculty, logo_url, logo_status)")
      .eq("competition_id", competition.id)
      .eq("payment_status", "paid"),
  ]);

  const fixtures = (rawFixtures ?? []) as Fixture[];
  const entries  = (rawEntries  ?? []) as EnteredClub[];

  const isLeague  = competition.format === "league" || competition.format === "group_stage";
  const standings = isLeague ? buildStandings(fixtures) : [];
  const hasResults = standings.some((r) => r.P > 0);

  const typeLabel: Record<string, string> = {
    flagship: "Championship", cup: "Cup", other: "Tournament",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Banner */}
      {competition.banner_image_url && (
        <div className="relative w-full h-48 sm:h-64 overflow-hidden mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={competition.banner_image_url}
            alt={competition.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
        </div>
      )}

      <Link
        href="/competitions"
        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors mb-12"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All competitions
      </Link>

      {/* Header */}
      <div className={`bg-card border border-white/6 border-l-[3px] ${COMP_STATUS_ACCENT[competition.status] ?? "border-l-white/20"} p-7 mb-14`}>
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">
          {typeLabel[competition.type] ?? competition.type} &middot; {competition.edition}
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
          <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">{competition.name}</h1>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[competition.status] ?? "bg-cobalt"}`} />
            <span className={`text-[11px] font-bold uppercase tracking-[0.12em] ${COMP_STATUS_TEXT[competition.status] ?? "text-white/30"}`}>
              {COMP_STATUS_LABEL[competition.status] ?? competition.status}
            </span>
          </div>
        </div>
        {competition.description && (
          <p className="text-white/40 text-[14px] max-w-2xl leading-relaxed">{competition.description}</p>
        )}
        <div className="flex items-center gap-6 mt-4">
          <span className="text-[11px] text-white/25 uppercase tracking-wider">
            {competition.format.replace(/_/g, " ")}
          </span>
          {competition.entry_fee > 0 && (
            <span className="text-[11px] text-white/25">
              Entry fee: &#x20A6;{competition.entry_fee.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">

        {/* Left: standings + fixtures */}
        <div className="lg:col-span-2 space-y-14">

          {/* Standings */}
          {isLeague && hasResults && (
            <section>
              <div className="flex items-center gap-4 mb-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim">Standings</p>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="border border-white/6 overflow-x-auto">
                <table className="w-full" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <thead>
                    <tr className="border-b border-white/6">
                      <th className="text-left text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-5 py-3 w-10">#</th>
                      <th className="text-left text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-3 py-3">Club</th>
                      <th className="text-center text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-3 py-3">P</th>
                      <th className="text-center text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-3 py-3">W</th>
                      <th className="text-center text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-3 py-3">L</th>
                      <th className="text-center text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-3 py-3">GD</th>
                      <th className="text-center text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-5 py-3">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {standings.map((row, i) => (
                      <tr key={row.club_id} className={`hover:bg-white/[0.02] transition-colors ${i === 0 ? "bg-gold/[0.04]" : ""}`}>
                        <td className="px-5 py-3.5 text-[11px] text-white/20 font-mono">{i + 1}</td>
                        <td className="px-3 py-3.5">
                          <Link href={`/clubs/${row.slug}`} className="flex items-center gap-2.5 group">
                            <ClubAvatar club={{ name: row.name, logo_url: row.logo_url, logo_status: row.logo_status }} size={6} />
                            <span className="font-medium text-[13px] text-white/80 group-hover:text-white transition-colors">
                              {row.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-3.5 text-center text-[13px] text-white/40">{row.P}</td>
                        <td className="px-3 py-3.5 text-center text-[13px] text-white/70">{row.W}</td>
                        <td className="px-3 py-3.5 text-center text-[13px] text-white/40">{row.L}</td>
                        <td className="px-3 py-3.5 text-center text-[13px] text-white/40">
                          {row.GF - row.GA > 0 ? "+" : ""}{row.GF - row.GA}
                        </td>
                        <td className="px-5 py-3.5 text-center font-display font-black text-xl text-gold">{row.Pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Fixtures */}
          <section>
            <div className="flex items-center gap-4 mb-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim">Fixtures</p>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {fixtures.length === 0 ? (
              <div className="border border-white/6 bg-card px-8 py-12 text-center">
                <p className="text-[13px] text-white/20">No fixtures scheduled yet.</p>
              </div>
            ) : (
              <div className="border border-white/6 divide-y divide-white/5 overflow-hidden">
                {fixtures.map((f) => (
                  <Link
                    key={f.id}
                    href={`/fixtures/${f.id}`}
                    className="flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors group overflow-hidden"
                  >
                    {/* Club A */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      <p className="hidden sm:block text-[13px] text-white/70 group-hover:text-white transition-colors truncate text-right">
                        {f.club_a?.name ?? "TBA"}
                      </p>
                      <ClubAvatar club={f.club_a} size={6} />
                    </div>

                    {/* Score / VS */}
                    <div className="w-16 text-center shrink-0">
                      {f.confirmed_score ? (
                        <span className="font-display font-black text-lg text-gold tabular-nums leading-none">
                          {f.confirmed_score.score_a}&nbsp;&ndash;&nbsp;{f.confirmed_score.score_b}
                        </span>
                      ) : (
                        <span className="text-[11px] text-white/15 font-bold tracking-[0.3em]">vs</span>
                      )}
                    </div>

                    {/* Club B */}
                    <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                      <ClubAvatar club={f.club_b} size={6} />
                      <p className="hidden sm:block text-[13px] text-white/70 group-hover:text-white transition-colors truncate">
                        {f.club_b?.name ?? "TBA"}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      {f.stage && f.stage !== "N/A" && (
                        <span className="text-[11px] text-white/20 uppercase tracking-wider">{f.stage}</span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[f.status] ?? "bg-cobalt"}`} />
                        <span className="text-[11px] text-white/30">{statusLabel[f.status] ?? f.status}</span>
                      </div>
                      {f.scheduled_at && (
                        <span className="text-[11px] text-white/20 tabular-nums">
                          {new Date(f.scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: clubs entered */}
        <div>
          <div className="flex items-center gap-4 mb-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim">
              Clubs entered ({entries.length})
            </p>
          </div>

          {entries.length === 0 ? (
            <div className="border border-white/6 bg-card px-6 py-10 text-center">
              <p className="text-[13px] text-white/20">No clubs registered yet.</p>
            </div>
          ) : (
            <div className="border border-white/6 divide-y divide-white/5">
              {entries.map(({ club }) =>
                club ? (
                  <Link
                    key={club.id}
                    href={`/clubs/${club.slug}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors group"
                  >
                    <ClubAvatar club={club} size={7} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[13px] text-white/80 group-hover:text-white transition-colors truncate">
                        {club.name}
                      </p>
                      <p className="text-[11px] text-white/25 truncate">{club.faculty}</p>
                    </div>
                  </Link>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
