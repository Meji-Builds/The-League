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

function FixtureRow({ f, clubs, competitions }: { f: Fixture; clubs: Club[]; competitions: Competition[] }) {
  return (
    <div className="p-4">
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
        hasLineupA={false}
        hasLineupB={false}
      />
    </div>
  );
}

export default async function AdminFixturesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const [{ data: rawFixtures }, { data: rawComps }, { data: rawClubs }] = await Promise.all([
    db.from("fixtures")
      .select(`
        id, stage, group_name, matchday, status, scheduled_at, competition_id,
        club_a:clubs!club_a_id(id, name),
        club_b:clubs!club_b_id(id, name),
        competition:competitions(name, edition)
      `)
      .order("scheduled_at", { ascending: false }),
    db.from("competitions").select("id, name, edition").order("created_at", { ascending: false }),
    db.from("clubs").select("id, name, faculty").eq("status", "approved").order("name"),
  ]);

  const fixtures     = (rawFixtures ?? []) as Fixture[];
  const competitions = (rawComps ?? []) as Competition[];
  const clubs        = (rawClubs ?? []) as Club[];

  const upcoming  = fixtures.filter((f) => f.status === "scheduled");
  const reported  = fixtures.filter((f) => f.status === "reported");
  const disputed  = fixtures.filter((f) => f.status === "disputed");
  const confirmed = fixtures.filter((f) => f.status === "confirmed");

  const sectionClass = "border border-white/6 divide-y divide-white/5 mb-8";

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
        <>
          {/* Disputed — show first so admin deals with them quickly */}
          {disputed.length > 0 && (
            <section>
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-danger mb-3">
                Disputed ({disputed.length})
              </p>
              <div className={sectionClass}>
                {disputed.map((f) => <FixtureRow key={f.id} f={f} clubs={clubs} competitions={competitions} />)}
              </div>
            </section>
          )}

          {/* Reported — awaiting confirmation */}
          {reported.length > 0 && (
            <section>
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-gold mb-3">
                Reported — awaiting confirmation ({reported.length})
              </p>
              <div className={sectionClass}>
                {reported.map((f) => <FixtureRow key={f.id} f={f} clubs={clubs} competitions={competitions} />)}
              </div>
            </section>
          )}

          {/* Upcoming / scheduled */}
          {upcoming.length > 0 && (
            <section>
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">
                Upcoming ({upcoming.length})
              </p>
              <div className={sectionClass}>
                {upcoming.map((f) => <FixtureRow key={f.id} f={f} clubs={clubs} competitions={competitions} />)}
              </div>
            </section>
          )}

          {/* Confirmed / played — admin can delete these to remove from public page */}
          {confirmed.length > 0 && (
            <section>
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-success mb-3">
                Confirmed / played ({confirmed.length}) — delete to remove from public page
              </p>
              <div className={sectionClass}>
                {confirmed.map((f) => <FixtureRow key={f.id} f={f} clubs={clubs} competitions={competitions} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
