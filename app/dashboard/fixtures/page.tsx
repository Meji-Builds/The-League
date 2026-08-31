import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClubLineupUploadForm } from "./ClubLineupUploadForm";

export const metadata = { title: "Fixtures" };

interface FixtureRow {
  id: string;
  stage: string;
  group_name: string;
  matchday: number;
  status: string;
  scheduled_at: string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a_id: string;
  club_b_id: string;
  lineup_image_a: string | null;
  lineup_image_b: string | null;
  club_a: { name: string } | null;
  club_b: { name: string } | null;
  competition: { name: string } | null;
}

const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-success",
  disputed:  "bg-danger",
  reported:  "bg-warning",
  scheduled: "bg-cobalt",
};

const STATUS_TEXT: Record<string, string> = {
  confirmed: "text-success",
  disputed:  "text-danger",
  reported:  "text-warning",
  scheduled: "text-cobalt",
};

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
      club_a_id, club_b_id, lineup_image_a, lineup_image_b,
      club_a:clubs!fixtures_club_a_id_fkey(name),
      club_b:clubs!fixtures_club_b_id_fkey(name),
      competition:competitions(name)
    `)
    .or(`club_a_id.eq.${owner.club_id},club_b_id.eq.${owner.club_id}`)
    .order("scheduled_at", { ascending: false });

  const fixtures = (rawFixtures ?? []) as FixtureRow[];

  const upcoming = fixtures.filter((f) => ["scheduled", "reported", "disputed"].includes(f.status));
  const past     = fixtures.filter((f) => f.status === "confirmed");

  const FixtureCard = ({ f }: { f: FixtureRow }) => {
    const isClubA  = f.club_a_id === owner.club_id;
    const hasLineup = isClubA ? !!f.lineup_image_a : !!f.lineup_image_b;

    return (
      <div className="bg-card border border-white/6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-[11px] text-white/30 mb-1">{f.competition?.name} &middot; {f.stage} &middot; Day {f.matchday}</p>
            <p className="font-medium text-white text-sm">
              {f.club_a?.name ?? "TBC"} vs {f.club_b?.name ?? "TBC"}
            </p>
            {f.confirmed_score && (
              <p className="font-display font-black text-xl text-gold mt-1">
                {f.confirmed_score.score_a} &ndash; {f.confirmed_score.score_b}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[11px] text-white/30">{formatDate(f.scheduled_at)}</p>
            <span className="flex items-center justify-end gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[f.status] ?? "bg-white/30"}`} />
              <span className={`text-[10px] font-bold uppercase tracking-[0.15em] capitalize ${STATUS_TEXT[f.status] ?? "text-white/30"}`}>
                {f.status}
              </span>
            </span>
          </div>
        </div>
        {["scheduled", "reported"].includes(f.status) && (
          <ClubLineupUploadForm fixtureId={f.id} hasLineup={hasLineup} />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Dashboard</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Fixtures</h1>
        <p className="text-white/40 text-[13px] mt-2">Your club&apos;s upcoming and past matches.</p>
      </div>

      {upcoming.length > 0 && (
        <section className="mb-10">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Upcoming</p>
          <div className="flex flex-col gap-3">
            {upcoming.map((f) => <FixtureCard key={f.id} f={f} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Results</p>
          <div className="flex flex-col gap-3">
            {past.map((f) => <FixtureCard key={f.id} f={f} />)}
          </div>
        </section>
      )}

      {fixtures.length === 0 && (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No fixtures scheduled yet. Enter a competition to get started.</p>
        </div>
      )}
    </div>
  );
}
