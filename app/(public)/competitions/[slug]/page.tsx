import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Fixture {
  id: string;
  stage: string;
  group_name: string;
  matchday: number;
  status: string;
  scheduled_at: string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a: { id: string; name: string; slug: string } | null;
  club_b: { id: string; name: string; slug: string } | null;
}

interface EnteredClub {
  club: { id: string; name: string; slug: string; faculty: string } | null;
  payment_status: string;
}

interface StandingRow {
  club_id: string;
  name:    string;
  slug:    string;
  P:  number;
  W:  number;
  L:  number;
  GF: number;
  GA: number;
  Pts: number;
}

const statusStyles: Record<string, string> = {
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

const AVATAR_PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

function avatarColor(name: string): string {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function nameInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function buildStandings(fixtures: Fixture[]): StandingRow[] {
  const map = new Map<string, StandingRow>();

  function ensure(club: { id: string; name: string; slug: string }) {
    if (!map.has(club.id)) {
      map.set(club.id, { club_id: club.id, name: club.name, slug: club.slug, P: 0, W: 0, L: 0, GF: 0, GA: 0, Pts: 0 });
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

    if (score_a > score_b) {
      a.W++; a.Pts += 3; b.L++;
    } else if (score_b > score_a) {
      b.W++; b.Pts += 3; a.L++;
    } else {
      a.Pts += 1; b.Pts += 1;
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    return (b.GF - b.GA) - (a.GF - a.GA);
  });
}

function formatDate(iso: string | null) {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
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
        club_a:clubs!fixtures_club_a_id_fkey(id, name, slug),
        club_b:clubs!fixtures_club_b_id_fkey(id, name, slug)
      `)
      .eq("competition_id", competition.id)
      .order("matchday")
      .order("scheduled_at"),
    db.from("competition_entries")
      .select("payment_status, club:clubs(id, name, slug, faculty)")
      .eq("competition_id", competition.id)
      .eq("payment_status", "paid"),
  ]);

  const fixtures = (rawFixtures ?? []) as Fixture[];
  const entries  = (rawEntries  ?? []) as EnteredClub[];

  const isLeague   = competition.format === "league" || competition.format === "group_stage";
  const standings  = isLeague ? buildStandings(fixtures) : [];
  const hasResults = standings.some((r) => r.P > 0);

  const typeLabel: Record<string, string> = {
    flagship: "Championship", cup: "Cup", other: "Tournament",
  };

  const compStatusLabel: Record<string, string> = {
    upcoming: "Upcoming", registration_open: "Reg. Open",
    in_progress: "In Progress", completed: "Completed",
  };

  const compStatusStyle: Record<string, string> = {
    in_progress:       "bg-success/10 text-success",
    registration_open: "bg-gold/10 text-gold",
    upcoming:          "bg-cobalt/10 text-cobalt",
    completed:         "bg-white/5 text-dim",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Competition banner */}
      {competition.banner_image_url && (
        <div className="relative w-full h-48 sm:h-64 overflow-hidden rounded mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={competition.banner_image_url}
            alt={competition.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/20 to-transparent" />
        </div>
      )}

      <Link
        href="/competitions"
        className="inline-flex items-center gap-1.5 text-sm text-dim hover:text-white transition-colors mb-8"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All competitions
      </Link>

      <div className="mb-10">
        <p className="text-xs text-gold font-bold uppercase tracking-wider mb-2">
          {typeLabel[competition.type] ?? competition.type} &middot; {competition.edition}
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-white uppercase">{competition.name}</h1>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${compStatusStyle[competition.status] ?? "bg-cobalt/10 text-cobalt"}`}>
            {compStatusLabel[competition.status] ?? competition.status}
          </span>
        </div>
        {competition.description && (
          <p className="text-dim text-sm max-w-2xl mt-3">{competition.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <span className="text-xs text-dim uppercase tracking-wider">
            {competition.format.replace(/_/g, " ")}
          </span>
          {competition.entry_fee > 0 && (
            <span className="text-xs text-dim">
              Entry fee: &#x20A6;{competition.entry_fee.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left: fixtures + standings */}
        <div className="lg:col-span-2 space-y-10">

          {/* Standings table */}
          {isLeague && hasResults && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-dim mb-4">
                Standings
              </h2>
              <div className="bg-card border border-rim overflow-hidden rounded overflow-x-auto">
                <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <thead>
                    <tr className="border-b border-rim text-xs text-dim uppercase tracking-wider">
                      <th className="text-left font-bold px-4 py-3 w-8">#</th>
                      <th className="text-left font-bold px-3 py-3">Club</th>
                      <th className="text-center font-bold px-3 py-3">P</th>
                      <th className="text-center font-bold px-3 py-3">W</th>
                      <th className="text-center font-bold px-3 py-3">L</th>
                      <th className="text-center font-bold px-3 py-3">GD</th>
                      <th className="text-center font-bold px-3 py-3 pr-4">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rim">
                    {standings.map((row, i) => (
                      <tr key={row.club_id} className={`hover:bg-white/5 transition-colors ${i === 0 ? "bg-gold/5" : ""}`}>
                        <td className="px-4 py-3 text-xs text-dim">{i + 1}</td>
                        <td className="px-3 py-3">
                          <Link href={`/clubs/${row.slug}`} className="flex items-center gap-2 group">
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center text-navy text-[9px] font-bold shrink-0"
                              style={{ backgroundColor: avatarColor(row.name) }}
                            >
                              {nameInitials(row.name)}
                            </div>
                            <span className="font-semibold text-white text-sm group-hover:text-gold transition-colors">
                              {row.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-dim">{row.P}</td>
                        <td className="px-3 py-3 text-center text-sm text-white">{row.W}</td>
                        <td className="px-3 py-3 text-center text-sm text-dim">{row.L}</td>
                        <td className="px-3 py-3 text-center text-sm text-dim">{row.GF - row.GA > 0 ? "+" : ""}{row.GF - row.GA}</td>
                        <td className="px-3 py-3 pr-4 text-center font-display font-bold text-gold text-base">{row.Pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Fixtures */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-dim mb-4">
              Fixtures
            </h2>

            {fixtures.length === 0 ? (
              <div className="border border-rim bg-card p-8 text-center rounded">
                <p className="text-dim text-sm">No fixtures scheduled yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {fixtures.map((f) => (
                  <div key={f.id} className="border border-rim bg-card p-4 rounded">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-dim uppercase tracking-wider">
                        {f.stage !== "N/A" ? f.stage : f.group_name}
                        {f.matchday ? ` · Day ${f.matchday}` : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        {f.scheduled_at && (
                          <span className="text-[10px] text-dim">{formatDate(f.scheduled_at)}</span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[f.status] ?? ""}`}>
                          {statusLabel[f.status] ?? f.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                        {f.club_a ? (
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
                        ) : (
                          <div className="w-10 h-10 rounded bg-rim flex items-center justify-center">
                            <span className="text-dim text-xs">TBC</span>
                          </div>
                        )}
                      </div>

                      <div className="text-center px-1 shrink-0">
                        {f.confirmed_score ? (
                          <p className="font-display text-xl font-bold text-white tabular-nums leading-none">
                            {f.confirmed_score.score_a}&nbsp;&ndash;&nbsp;{f.confirmed_score.score_b}
                          </p>
                        ) : (
                          <p className="text-xs font-bold text-dim tracking-widest">VS</p>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                        {f.club_b ? (
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
                        ) : (
                          <div className="w-10 h-10 rounded bg-rim flex items-center justify-center">
                            <span className="text-dim text-xs">TBC</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: clubs entered */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-dim mb-4">
            Clubs entered ({entries.length})
          </h2>

          {entries.length === 0 ? (
            <div className="border border-rim bg-card p-6 text-center rounded">
              <p className="text-dim text-sm">No clubs registered yet.</p>
            </div>
          ) : (
            <div className="bg-card border border-rim divide-y divide-rim rounded overflow-hidden">
              {entries.map(({ club }) =>
                club ? (
                  <Link
                    key={club.id}
                    href={`/clubs/${club.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                  >
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-navy text-xs font-bold shrink-0"
                      style={{ backgroundColor: avatarColor(club.name) }}
                    >
                      {nameInitials(club.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm group-hover:text-gold transition-colors truncate">
                        {club.name}
                      </p>
                      <p className="text-xs text-dim truncate">{club.faculty}</p>
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
