import { redirect } from "next/navigation";
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
  club_a: { name: string } | null;
  club_b: { name: string } | null;
  competition: { name: string } | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default async function FixturesPage() {
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
      id, stage, group_name, matchday, status, scheduled_at, confirmed_score,
      club_a:clubs!fixtures_club_a_id_fkey(name),
      club_b:clubs!fixtures_club_b_id_fkey(name),
      competition:competitions(name)
    `)
    .or(`club_a_id.eq.${owner.club_id},club_b_id.eq.${owner.club_id}`)
    .order("scheduled_at", { ascending: false });

  const fixtures = (rawFixtures ?? []) as FixtureRow[];

  const upcoming = fixtures.filter((f) => ["scheduled", "reported", "disputed"].includes(f.status));
  const past = fixtures.filter((f) => f.status === "confirmed");

  const FixtureCard = ({ f }: { f: FixtureRow }) => (
    <div className="border border-border bg-white rounded p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="text-xs text-muted mb-1">{f.competition?.name} &middot; {f.stage} &middot; Day {f.matchday}</p>
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
        <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded capitalize
          ${f.status === "confirmed" ? "bg-success/10 text-success" : ""}
          ${f.status === "disputed" ? "bg-danger/10 text-danger" : ""}
          ${f.status === "reported" ? "bg-warning/10 text-warning" : ""}
          ${f.status === "scheduled" ? "bg-cobalt/10 text-cobalt" : ""}
        `}>
          {f.status}
        </span>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Fixtures</h1>
        <p className="text-muted text-sm mt-1">Your club&apos;s upcoming and past matches.</p>
      </div>

      {upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Upcoming</h2>
          <div className="flex flex-col gap-3">
            {upcoming.map((f) => <FixtureCard key={f.id} f={f} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Results</h2>
          <div className="flex flex-col gap-3">
            {past.map((f) => <FixtureCard key={f.id} f={f} />)}
          </div>
        </section>
      )}

      {fixtures.length === 0 && (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No fixtures scheduled yet. Enter a competition to get started.</p>
        </div>
      )}
    </div>
  );
}
