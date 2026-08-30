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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Livestreams</h1>
        <p className="text-muted text-sm mt-1">
          Add one or more active streams — all will appear on the homepage simultaneously.
        </p>
      </div>

      <div className="mb-10">
        <LivestreamForm />
      </div>

      {streams.length === 0 ? (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No active streams. Add one above to go live.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {streams.map((s) => (
            <div key={s.id} className="border border-border bg-white rounded p-4 flex items-center gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
                </span>
                <span className="text-xs font-semibold text-danger uppercase tracking-wider">Live</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-navy text-sm truncate">{s.title}</p>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cobalt hover:underline truncate block"
                >
                  {s.url}
                </a>
              </div>
              <DeleteButton
                action={deleteLivestream}
                id={s.id}
                confirm={`End "${s.title}"?`}
                className="text-xs text-danger hover:text-danger/70 transition-colors shrink-0"
              >
                End stream
              </DeleteButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
