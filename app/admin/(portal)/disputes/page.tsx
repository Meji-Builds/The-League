import { createClient } from "@/lib/supabase/server";
import { ResolveForm } from "./ResolveForm";

export const metadata = { title: "Admin — Disputes" };

interface Report {
  score_a: number;
  score_b: number;
  proof_image_url: string;
  submitted_at: string;
}

interface DisputedFixture {
  id: string;
  stage: string;
  matchday: number;
  club_a_id: string;
  club_b_id: string;
  reported_by_a: Report | null;
  reported_by_b: Report | null;
  club_a: { name: string } | null;
  club_b: { name: string } | null;
  competition: { name: string } | null;
}

export default async function AdminDisputesPage() {
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
    .eq("status", "disputed")
    .order("created_at", { ascending: false });

  const fixtures = (rawFixtures ?? []) as DisputedFixture[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-2">Disputes</h1>
      <p className="text-muted text-sm mb-8">
        Compare both sides and set the official score.
      </p>

      {fixtures.length === 0 ? (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No disputed fixtures at this time.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {fixtures.map((f) => (
            <div key={f.id} className="border border-danger/30 bg-white rounded p-5">
              <p className="text-xs text-muted mb-1">
                {f.competition?.name} &middot; {f.stage} &middot; Day {f.matchday}
              </p>
              <p className="font-semibold text-navy text-sm mb-4">
                {f.club_a?.name ?? "TBC"} vs {f.club_b?.name ?? "TBC"}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                {[
                  { label: f.club_a?.name ?? "Club A", report: f.reported_by_a },
                  { label: f.club_b?.name ?? "Club B", report: f.reported_by_b },
                ].map(({ label, report }) => (
                  <div key={label} className="border border-border rounded p-3">
                    <p className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">{label}</p>
                    {report ? (
                      <>
                        <p className="text-lg font-bold text-navy">
                          {report.score_a} &ndash; {report.score_b}
                        </p>
                        <a
                          href={report.proof_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cobalt hover:underline mt-1 inline-block"
                        >
                          View proof
                        </a>
                      </>
                    ) : (
                      <p className="text-xs text-muted">No report submitted</p>
                    )}
                  </div>
                ))}
              </div>

              <ResolveForm
                fixtureId={f.id}
                clubAId={f.club_a_id}
                clubBId={f.club_b_id}
                clubAName={f.club_a?.name ?? "Club A"}
                clubBName={f.club_b?.name ?? "Club B"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
