import { createClient } from "@/lib/supabase/server";
import { updateCompetitionStatus } from "./actions";
import { CreateCompetitionForm } from "./CreateCompetitionForm";
import { BannerUploadForm } from "./BannerUploadForm";

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
  banner_image_url: string | null;
}

const STATUS_DOT: Record<string, string> = {
  upcoming:          "bg-cobalt",
  registration_open: "bg-success",
  in_progress:       "bg-gold",
  completed:         "bg-white/20",
};

const STATUS_TEXT: Record<string, string> = {
  upcoming:          "text-cobalt",
  registration_open: "text-success",
  in_progress:       "text-gold",
  completed:         "text-white/30",
};

export default async function AdminCompetitionsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const { data: rawComps } = await db
    .from("competitions")
    .select("id, name, type, format, cycle, edition, entry_fee, status, description, created_at, banner_image_url")
    .order("created_at", { ascending: false });

  const competitions = (rawComps ?? []) as Competition[];

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Competitions</h1>
      </div>

      <div className="mb-10">
        <CreateCompetitionForm />
      </div>

      {competitions.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No competitions yet. Create the first one above.</p>
        </div>
      ) : (
        <div className="border border-white/6 divide-y divide-white/5">
          {competitions.map((comp) => (
            <div key={comp.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-white text-sm">{comp.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[comp.status] ?? "bg-white/20"}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${STATUS_TEXT[comp.status] ?? "text-white/30"}`}>
                        {comp.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/30">
                    {comp.type} &middot; {comp.format.replace("_", " ")} &middot; {comp.cycle} &middot; {comp.edition}
                  </p>
                  {comp.entry_fee > 0 && (
                    <p className="text-[11px] text-white/30 mt-0.5">Entry: NGN {comp.entry_fee.toLocaleString()}</p>
                  )}
                  {comp.description && (
                    <p className="text-[11px] text-white/25 mt-1 line-clamp-2">{comp.description}</p>
                  )}
                </div>

                <form action={updateCompetitionStatus} className="flex items-center gap-2 flex-shrink-0">
                  <input type="hidden" name="competition_id" value={comp.id} />
                  <select
                    name="status"
                    defaultValue={comp.status}
                    className="border border-white/10 bg-white/5 text-white text-xs px-2 py-1.5 focus:outline-none focus:border-cobalt"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="registration_open">Registration open</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button type="submit" className="text-xs font-semibold px-3 py-1.5 bg-cobalt/10 text-cobalt hover:bg-cobalt/20 transition-colors">
                    Save
                  </button>
                </form>
              </div>

              <BannerUploadForm competitionId={comp.id} currentBannerUrl={comp.banner_image_url} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
