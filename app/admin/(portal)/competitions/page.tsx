import { createClient } from "@/lib/supabase/server";
import { updateCompetitionStatus } from "./actions";
import { CreateCompetitionForm } from "./CreateCompetitionForm";

export const metadata = { title: "Admin — Competitions" };

interface Competition {
  id: string;
  name: string;
  type: string;
  format: string;
  cycle: string;
  edition: string;
  entry_fee: number;
  status: string;
  description: string | null;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  upcoming:          "bg-cobalt/10 text-cobalt",
  registration_open: "bg-success/10 text-success",
  in_progress:       "bg-warning/10 text-warning",
  completed:         "bg-muted/10 text-muted",
};

export default async function AdminCompetitionsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const { data: rawComps } = await db
    .from("competitions")
    .select("id, name, type, format, cycle, edition, entry_fee, status, description, created_at")
    .order("created_at", { ascending: false });

  const competitions = (rawComps ?? []) as Competition[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-8">Competitions</h1>

      <div className="mb-10">
        <CreateCompetitionForm />
      </div>

      {competitions.length === 0 ? (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No competitions yet. Create the first one above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {competitions.map((comp) => (
            <div key={comp.id} className="border border-border bg-white rounded p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-semibold text-navy text-sm">{comp.name}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${statusStyles[comp.status] ?? ""}`}>
                      {comp.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {comp.type} &middot; {comp.format.replace("_", " ")} &middot; {comp.cycle} &middot; {comp.edition}
                  </p>
                  {comp.entry_fee > 0 && (
                    <p className="text-xs text-muted mt-0.5">Entry: NGN {comp.entry_fee.toLocaleString()}</p>
                  )}
                  {comp.description && (
                    <p className="text-xs text-muted mt-1">{comp.description}</p>
                  )}
                </div>

                <form action={updateCompetitionStatus} className="flex items-center gap-2 flex-shrink-0">
                  <input type="hidden" name="competition_id" value={comp.id} />
                  <select
                    name="status"
                    defaultValue={comp.status}
                    className="border border-border text-navy text-xs px-2 py-1.5 rounded focus:outline-none focus:border-cobalt"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="registration_open">Registration open</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded bg-cobalt/10 text-cobalt hover:bg-cobalt/20 transition-colors">
                    Save
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
