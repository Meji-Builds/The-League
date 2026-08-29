import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Fixtures" };

interface FixtureRow {
  id: string;
  stage: string;
  group_name: string;
  matchday: number;
  status: string;
  scheduled_at: string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a: { id: string; name: string; slug: string; logo_url: string | null } | null;
  club_b: { id: string; name: string; slug: string; logo_url: string | null } | null;
  competition: { id: string; name: string; slug: string } | null;
}

async function getFixtures(): Promise<FixtureRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("fixtures")
      .select(`
        *,
        club_a:clubs!fixtures_club_a_id_fkey(id, name, slug, logo_url),
        club_b:clubs!fixtures_club_b_id_fkey(id, name, slug, logo_url),
        competition:competitions(id, name, slug)
      `)
      .order("scheduled_at", { ascending: true })
      .limit(50);
    return (data ?? []) as unknown as FixtureRow[];
  } catch {
    return [];
  }
}

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  reported:  "Reported",
  disputed:  "Disputed",
  confirmed: "Confirmed",
};

const statusColor: Record<string, string> = {
  scheduled: "text-muted border-border",
  reported:  "text-cobalt border-cobalt",
  disputed:  "text-warning border-warning",
  confirmed: "text-success border-success",
};

export default async function FixturesPage() {
  const fixtures = await getFixtures();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-navy mb-2">Fixtures</h1>
      <p className="text-muted text-sm mb-10">All scheduled and completed matches.</p>

      {fixtures.length === 0 ? (
        <div className="border border-border bg-white px-8 py-14 text-center">
          <p className="text-navy font-semibold">No fixtures scheduled yet.</p>
          <p className="text-muted text-sm mt-2">Check back once the competition stage begins.</p>
        </div>
      ) : (
        <div className="bg-white border border-border divide-y divide-border">
          {fixtures.map((f) => (
            <div key={f.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Competition + stage */}
              <div className="sm:w-40 shrink-0">
                <p className="text-xs font-medium text-cobalt">{f.competition?.name}</p>
                <p className="text-xs text-muted">{f.stage !== "N/A" ? `${f.stage} Stage` : f.group_name}</p>
                <p className="text-xs text-muted">Matchday {f.matchday}</p>
              </div>

              {/* Match */}
              <div className="flex-1 flex items-center justify-between sm:justify-center gap-4">
                <span className="font-semibold text-navy text-sm text-right sm:text-left flex-1">
                  {f.club_a?.name}
                </span>

                <div className="text-center shrink-0">
                  {f.confirmed_score ? (
                    <span className="font-bold text-lg text-navy tabular-nums">
                      {f.confirmed_score.score_a} &ndash; {f.confirmed_score.score_b}
                    </span>
                  ) : (
                    <span className="text-muted text-xs font-medium">vs</span>
                  )}
                </div>

                <span className="font-semibold text-navy text-sm flex-1">{f.club_b?.name}</span>
              </div>

              {/* Status + date */}
              <div className="sm:w-36 shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
                <span className={`text-xs border px-2 py-0.5 ${statusColor[f.status]}`}>
                  {statusLabel[f.status]}
                </span>
                {f.scheduled_at && (
                  <span className="text-xs text-muted">
                    {new Date(f.scheduled_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
