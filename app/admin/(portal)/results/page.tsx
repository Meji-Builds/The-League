import { createClient } from "@/lib/supabase/server";
import { ConfirmResultForm } from "./ConfirmResultForm";
import { markDisputed } from "./actions";
import { DeleteButton } from "@/app/admin/_components/DeleteButton";

export const metadata = { title: "Admin — Results" };

interface Report {
  score_a:         number;
  score_b:         number;
  proof_image_url: string;
  submitted_at:    string;
}

interface ReportedFixture {
  id:           string;
  stage:        string;
  matchday:     number;
  club_a_id:    string;
  club_b_id:    string;
  reported_by_a: Report | null;
  reported_by_b: Report | null;
  club_a:       { name: string } | null;
  club_b:       { name: string } | null;
  competition:  { name: string } | null;
}

export default async function AdminResultsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const { data: rawFixtures } = await db
    .from("fixtures")
    .select(`
      id, stage, matchday, club_a_id, club_b_id, reported_by_a, reported_by_b,
      club_a:clubs!fixtures_club_a_id_fkey(name),
      club_b:clubs!fixtures_club_b_id_fkey(name),
      competition:competitions(name)
    `)
    .eq("status", "reported")
    .order("created_at", { ascending: false });

  const fixtures = (rawFixtures ?? []) as ReportedFixture[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Match Results</h1>
        <p className="text-muted text-sm mt-1">
          Review submitted match scores. Confirm when scores match, or mark as disputed.
        </p>
      </div>

      {fixtures.length === 0 ? (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No results awaiting review.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {fixtures.map((f) => {
            const scoresMatch =
              f.reported_by_a && f.reported_by_b &&
              f.reported_by_a.score_a === f.reported_by_b.score_a &&
              f.reported_by_a.score_b === f.reported_by_b.score_b;

            const defaultA = f.reported_by_a?.score_a ?? f.reported_by_b?.score_a ?? 0;
            const defaultB = f.reported_by_a?.score_b ?? f.reported_by_b?.score_b ?? 0;

            return (
              <div key={f.id} className="border border-border bg-white rounded p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted mb-0.5">
                      {f.competition?.name} &middot; {f.stage} &middot; Day {f.matchday}
                    </p>
                    <p className="font-semibold text-navy text-sm">
                      {f.club_a?.name ?? "TBC"} vs {f.club_b?.name ?? "TBC"}
                    </p>
                  </div>
                  {scoresMatch ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-success/10 text-success shrink-0">
                      Scores match
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-warning/10 text-warning shrink-0">
                      Scores differ
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-1">
                  {[
                    { label: f.club_a?.name ?? "Club A", report: f.reported_by_a },
                    { label: f.club_b?.name ?? "Club B", report: f.reported_by_b },
                  ].map(({ label, report }) => (
                    <div key={label} className="border border-border rounded p-3">
                      <p className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">{label}</p>
                      {report ? (
                        <>
                          <p className="text-xl font-bold text-navy tabular-nums">
                            {report.score_a}&nbsp;&ndash;&nbsp;{report.score_b}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {new Date(report.submitted_at).toLocaleString("en-GB", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                          {report.proof_image_url && (
                            <a
                              href={report.proof_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-cobalt hover:underline mt-1 inline-block"
                            >
                              View proof
                            </a>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted">Not submitted yet</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border">
                  <ConfirmResultForm
                    fixtureId={f.id}
                    clubAId={f.club_a_id}
                    clubBId={f.club_b_id}
                    clubAName={f.club_a?.name ?? "Club A"}
                    clubBName={f.club_b?.name ?? "Club B"}
                    defaultA={defaultA}
                    defaultB={defaultB}
                  />
                  <DeleteButton
                    action={markDisputed}
                    id={f.id}
                    confirm="Mark this fixture as disputed?"
                    className="text-xs font-semibold px-4 py-1.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                  >
                    Mark disputed
                  </DeleteButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
