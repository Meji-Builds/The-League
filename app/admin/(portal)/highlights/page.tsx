import { createClient } from "@/lib/supabase/server";
import { HighlightForm } from "./HighlightForm";
import { deleteHighlight } from "./actions";
import { DeleteButton } from "@/app/admin/_components/DeleteButton";

export const metadata = { title: "Admin — Highlights" };

interface Highlight {
  id:           string;
  title:        string;
  video_url:    string;
  thumbnail_url: string | null;
  published_at: string;
  competition:  { name: string } | null;
}

interface Competition {
  id:   string;
  name: string;
}

function youtubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export default async function AdminHighlightsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const [{ data: rawHighlights }, { data: rawCompetitions }] = await Promise.all([
    db.from("highlights")
      .select("id, title, video_url, thumbnail_url, published_at, competition:competitions(name)")
      .order("published_at", { ascending: false }),
    db.from("competitions").select("id, name").order("name"),
  ]);

  const highlights    = (rawHighlights    ?? []) as Highlight[];
  const competitions  = (rawCompetitions  ?? []) as Competition[];

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Highlights</h1>
      </div>

      <div className="mb-10">
        <HighlightForm competitions={competitions} />
      </div>

      {highlights.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No highlights yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-px bg-white/5 border border-white/5">
          {highlights.map((h) => {
            const vid = youtubeId(h.video_url);
            return (
              <div key={h.id} className="bg-card overflow-hidden">
                {vid ? (
                  <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${vid}`}
                      title={h.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : h.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.thumbnail_url} alt={h.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="h-24 bg-white/5 flex items-center justify-center">
                    <a href={h.video_url} target="_blank" rel="noopener noreferrer" className="text-cobalt text-xs hover:text-white transition-colors">
                      {h.video_url}
                    </a>
                  </div>
                )}
                <div className="p-4 flex items-start justify-between gap-2 border-t border-white/5">
                  <div className="min-w-0">
                    {h.competition && (
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cobalt mb-0.5">{h.competition.name}</p>
                    )}
                    <p className="font-medium text-white text-sm truncate">{h.title}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {new Date(h.published_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <DeleteButton action={deleteHighlight} id={h.id} confirm="Delete this highlight?" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
