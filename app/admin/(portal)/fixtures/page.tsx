import { createClient } from "@/lib/supabase/server";
import { CreateFixtureForm } from "./CreateFixtureForm";
import { EditFixtureForm } from "./EditFixtureForm";
import { LineupUploadForm } from "./LineupUploadForm";

export const metadata = { title: "Admin — Fixtures" };

interface Fixture {
  id:             string;
  stage:          string;
  group_name:     string;
  matchday:       number;
  status:         string;
  scheduled_at:   string | null;
  competition_id: string;
  lineup_image_a: string | null;
  lineup_image_b: string | null;
  club_a:         { id: string; name: string } | null;
  club_b:         { id: string; name: string } | null;
  competition:    { name: string; edition: string } | null;
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

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-cobalt",
  reported:  "bg-gold",
  disputed:  "bg-danger",
  confirmed: "bg-success",
};

const STATUS_TEXT: Record<string, string> = {
  scheduled: "text-cobalt",
  reported:  "text-gold",
  disputed:  "text-danger",
  confirmed: "text-success",
};

export default async function AdminFixturesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const [{ data: rawFixtures }, { data: rawComps }, { data: rawClubs }] = await Promise.all([
    db.from("fixtures")
      .select(`
        id, stage, group_name, matchday, status, scheduled_at, competition_id, lineup_image_a, lineup_image_b,
        club_a:clubs!fixtures_club_a_id_fkey(id, name),
        club_b:clubs!fixtures_club_b_id_fkey(id, name),
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
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Fixtures</h1>
      </div>

      <div className="mb-10">
        <CreateFixtureForm competitions={competitions} clubs={clubs} />
      </div>

      {fixtures.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No fixtures scheduled yet.</p>
        </div>
      ) : (
        <div className="border border-white/6 divide-y divide-white/5">
          {fixtures.map((f) => (
            <div key={f.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="text-[10px] text-white/30 mb-0.5 uppercase tracking-wider">
                    {f.competition?.name} ({f.competition?.edition}) &middot; {f.stage} &middot; {f.group_name} &middot; Day {f.matchday}
                  </p>
                  <p className="font-medium text-white text-sm">
                    {f.club_a?.name ?? "TBC"} vs {f.club_b?.name ?? "TBC"}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[11px] text-white/30">{formatDate(f.scheduled_at)}</p>
                    <div className="flex items-center gap-1.5 justify-end mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[f.status] ?? "bg-white/20"}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${STATUS_TEXT[f.status] ?? "text-white/30"}`}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                  <EditFixtureForm fixture={f} clubs={clubs} competitions={competitions} />
                </div>
              </div>
              <LineupUploadForm
                fixtureId={f.id}
                clubAName={f.club_a?.name ?? "Club A"}
                clubBName={f.club_b?.name ?? "Club B"}
                hasLineupA={!!f.lineup_image_a}
                hasLineupB={!!f.lineup_image_b}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
