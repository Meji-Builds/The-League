import { createClient } from "@/lib/supabase/server";
import { CreateFixtureForm } from "./CreateFixtureForm";
import { EditFixtureForm } from "./EditFixtureForm";

export const metadata = { title: "Admin — Fixtures" };

interface Fixture {
  id: string;
  stage: string;
  group_name: string;
  matchday: number;
  status: string;
  scheduled_at: string | null;
  club_a: { name: string } | null;
  club_b: { name: string } | null;
  competition: { name: string; edition: string } | null;
}

interface Competition {
  id: string;
  name: string;
  edition: string;
}

interface Club {
  id: string;
  name: string;
  faculty: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const statusStyles: Record<string, string> = {
  scheduled: "bg-cobalt/10 text-cobalt",
  reported:  "bg-warning/10 text-warning",
  disputed:  "bg-danger/10 text-danger",
  confirmed: "bg-success/10 text-success",
};

export default async function AdminFixturesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const [{ data: rawFixtures }, { data: rawComps }, { data: rawClubs }] = await Promise.all([
    db.from("fixtures")
      .select(`
        id, stage, group_name, matchday, status, scheduled_at,
        club_a:clubs!fixtures_club_a_id_fkey(name),
        club_b:clubs!fixtures_club_b_id_fkey(name),
        competition:competitions(name, edition)
      `)
      .order("scheduled_at", { ascending: false }),
    db.from("competitions").select("id, name, edition").order("created_at", { ascending: false }),
    db.from("clubs").select("id, name, faculty").eq("status", "approved").order("name"),
  ]);

  const fixtures     = (rawFixtures ?? []) as Fixture[];
  const competitions = (rawComps ?? []) as Competition[];
  const clubs        = (rawClubs ?? []) as Club[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-8">Fixtures</h1>

      <div className="mb-10">
        <CreateFixtureForm competitions={competitions} clubs={clubs} />
      </div>

      {fixtures.length === 0 ? (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No fixtures scheduled yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {fixtures.map((f) => (
            <div key={f.id} className="border border-border bg-white rounded p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted mb-0.5">
                    {f.competition?.name} ({f.competition?.edition}) &middot; {f.stage} &middot; {f.group_name} &middot; Day {f.matchday}
                  </p>
                  <p className="font-semibold text-navy text-sm">
                    {f.club_a?.name ?? "TBC"} vs {f.club_b?.name ?? "TBC"}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted">{formatDate(f.scheduled_at)}</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded capitalize ${statusStyles[f.status] ?? ""}`}>
                      {f.status}
                    </span>
                  </div>
                  <EditFixtureForm fixture={f} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
