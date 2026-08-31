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
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Disputes</h1>
        <p className="text-white/40 text-[13px] mt-2">Compare both sides and set the official score.</p>
      </div>

      {fixtures.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No disputed fixtures at this time.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {fixtures.map((f) => (
            <div key={f.id} className="border border-danger/30 border-l-[3px] border-l-danger bg-card">
              <div className="px-5 py-4 border-b border-white/5">
                <p className="text-[10px] text-white/30 mb-0.5 uppercase tracking-wider">
                  {f.competition?.name} &middot; {f.stage} &middot; Day {f.matchday}
                </p>
                <p className="font-medium text-white text-sm">
                  {f.club_a?.name ?? "TBC"} vs {f.club_b?.name ?? "TBC"}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-px bg-white/5 p-px">
                {[
                  { label: f.club_a?.name ?? "Club A", report: f.reported_by_a },
                  { label: f.club_b?.name ?? "Club B", report: f.reported_by_b },
                ].map(({ label, report }) => (
                  <div key={label} className="bg-card p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-dim mb-2">{label}</p>
                    {report ? (
                      <>
                        <p className="font-display font-black text-2xl text-white leading-none">
                          {report.score_a} &ndash; {report.score_b}
                        </p>
                        <a
                          href={report.proof_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-cobalt hover:text-white transition-colors mt-1 inline-block"
                        >
                          View proof
                        </a>
                      </>
                    ) : (
                      <p className="text-[11px] text-white/25">No report submitted</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-white/5">
                <ResolveForm
                  fixtureId={f.id}
                  clubAId={f.club_a_id}
                  clubBId={f.club_b_id}
                  clubAName={f.club_a?.name ?? "Club A"}
                  clubBName={f.club_b?.name ?? "Club B"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
