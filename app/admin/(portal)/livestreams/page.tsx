import { createClient } from "@/lib/supabase/server";
import { LivestreamForm } from "./LivestreamForm";
import { deleteLivestream } from "./actions";
import { DeleteButton } from "@/app/admin/_components/DeleteButton";

export const metadata = { title: "Admin — Livestreams" };

interface Livestream {
  id:         string;
  url:        string;
  title:      string;
  is_active:  boolean;
  created_at: string;
}

export default async function AdminLivestreamsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const { data } = await db
    .from("livestreams")
    .select("*")
    .order("created_at", { ascending: false });

  const streams = (data ?? []) as Livestream[];

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Livestreams</h1>
        <p className="text-white/40 text-[13px] mt-2">
          Add one or more active streams — all will appear on the homepage simultaneously.
        </p>
      </div>

      <div className="mb-10">
        <LivestreamForm />
      </div>

      {streams.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No active streams. Add one above to go live.</p>
        </div>
      ) : (
        <div className="border border-white/6 divide-y divide-white/5">
          {streams.map((s) => (
            <div key={s.id} className="bg-card flex items-center gap-4 px-4 py-4">
              <div className="flex items-center gap-2 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-danger">Live</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{s.title}</p>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-cobalt hover:text-white transition-colors truncate block mt-0.5"
                >
                  {s.url}
                </a>
              </div>
              <DeleteButton action={deleteLivestream} id={s.id} confirm={`End "${s.title}"?`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
