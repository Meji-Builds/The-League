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
  club_a: { name: string } | null;
  club_b: { name: string } | null;
}

interface EnteredClub {
  club: { id: string; name: string; faculty: string } | null;
  payment_status: string;
}

const statusStyles: Record<string, string> = {
  scheduled: "bg-cobalt/10 text-cobalt",
  reported:  "bg-warning/10 text-warning",
  disputed:  "bg-danger/10 text-danger",
  confirmed: "bg-success/10 text-success",
};

function formatDate(iso: string | null) {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
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
        club_a:clubs!fixtures_club_a_id_fkey(name),
        club_b:clubs!fixtures_club_b_id_fkey(name)
      `)
      .eq("competition_id", competition.id)
      .order("matchday")
      .order("scheduled_at"),
    db.from("competition_entries")
      .select("payment_status, club:clubs(id, name, faculty)")
      .eq("competition_id", competition.id)
      .eq("payment_status", "paid"),
  ]);

  const fixtures = (rawFixtures ?? []) as Fixture[];
  const entries  = (rawEntries ?? []) as EnteredClub[];

  const typeLabel: Record<string, string> = {
    flagship: "Championship", cup: "Cup", other: "Tournament",
  };

  const statusLabel: Record<string, string> = {
    upcoming: "Upcoming", registration_open: "Registration Open",
    in_progress: "In Progress", completed: "Completed",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-xs text-cobalt font-semibold uppercase tracking-wider mb-2">
          {typeLabel[competition.type] ?? competition.type} &middot; {competition.edition}
        </p>
        <h1 className="text-3xl font-bold text-navy mb-2">{competition.name}</h1>
        {competition.description && (
          <p className="text-muted text-sm max-w-2xl">{competition.description}</p>
        )}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <span className="text-xs border border-border text-muted px-2 py-1">
            {statusLabel[competition.status] ?? competition.status}
          </span>
          <span className="text-xs text-muted">
            Format: {competition.format.replace("_", " ")}
          </span>
          {competition.entry_fee > 0 && (
            <span className="text-xs text-muted">
              Entry fee: &#x20A6;{competition.entry_fee.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
            Fixtures
          </h2>

          {fixtures.length === 0 ? (
            <div className="border border-border bg-white p-8 text-center">
              <p className="text-muted text-sm">No fixtures scheduled yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {fixtures.map((f) => (
                <div key={f.id} className="border border-border bg-white p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-muted mb-1">
                      {f.stage} &middot; {f.group_name} &middot; Day {f.matchday}
                    </p>
                    <p className="font-semibold text-navy text-sm">
                      {f.club_a?.name ?? "TBC"} vs {f.club_b?.name ?? "TBC"}
                    </p>
                    {f.confirmed_score && (
                      <p className="text-lg font-bold text-navy mt-1">
                        {f.confirmed_score.score_a} &ndash; {f.confirmed_score.score_b}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted">{formatDate(f.scheduled_at)}</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded capitalize ${statusStyles[f.status] ?? ""}`}>
                      {f.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
            Clubs entered ({entries.length})
          </h2>

          {entries.length === 0 ? (
            <div className="border border-border bg-white p-6 text-center">
              <p className="text-muted text-sm">No clubs registered yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map(({ club }) =>
                club ? (
                  <div key={club.id} className="border border-border bg-white px-4 py-3">
                    <p className="font-semibold text-navy text-sm">{club.name}</p>
                    <p className="text-xs text-muted mt-0.5">{club.faculty}</p>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
