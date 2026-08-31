import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitResultForm } from "./SubmitResultForm";

export const metadata = { title: "Report a Result" };

interface FixtureRow {
  id: string;
  stage: string;
  matchday: number;
  status: string;
  scheduled_at: string | null;
  club_a_id: string;
  club_b_id: string;
  reported_by_a: object | null;
  reported_by_b: object | null;
  club_a: { name: string } | null;
  club_b: { name: string } | null;
  competition: { name: string } | null;
}

export default async function ResultsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: owner } = await db
    .from("club_owners")
    .select("club_id")
    .eq("user_id", user.id)
    .single();

  if (!owner?.club_id) redirect("/dashboard/onboarding");

  const { data: rawFixtures } = await db
    .from("fixtures")
    .select(`
      id, stage, matchday, status, scheduled_at, club_a_id, club_b_id,
      reported_by_a, reported_by_b,
      club_a:clubs!fixtures_club_a_id_fkey(name),
      club_b:clubs!fixtures_club_b_id_fkey(name),
      competition:competitions(name)
    `)
    .or(`club_a_id.eq.${owner.club_id},club_b_id.eq.${owner.club_id}`)
    .in("status", ["scheduled", "reported"])
    .order("scheduled_at");

  const fixtures = (rawFixtures ?? []) as FixtureRow[];

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Dashboard</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Report a Result</h1>
        <p className="text-white/40 text-[13px] mt-2">
          Submit your score and proof for each match. Both sides must report — if scores match, the result is confirmed automatically.
        </p>
      </div>

      {fixtures.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No matches to report right now.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {fixtures.map((f) => (
            <div key={f.id} className="border border-white/6 bg-card p-5">
              <p className="text-[11px] text-white/30 mb-1">{f.competition?.name} &middot; {f.stage} &middot; Day {f.matchday}</p>
              <p className="font-medium text-white text-sm mb-4">
                {f.club_a?.name ?? "TBC"} vs {f.club_b?.name ?? "TBC"}
              </p>
              <SubmitResultForm
                fixtureId={f.id}
                clubId={owner.club_id}
                isClubA={f.club_a_id === owner.club_id}
                opponentName={f.club_a_id === owner.club_id ? (f.club_b?.name ?? "Opponent") : (f.club_a?.name ?? "Opponent")}
                hasSubmitted={f.club_a_id === owner.club_id ? !!f.reported_by_a : !!f.reported_by_b}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
