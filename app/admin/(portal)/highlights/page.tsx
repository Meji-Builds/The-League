import { createClient } from "@/lib/supabase/server";
import { HighlightForm } from "./HighlightForm";
import { deleteHighlight } from "./actions";

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
      <h1 className="text-2xl font-bold text-navy mb-8">Highlights</h1>

      <div className="mb-10">
        <HighlightForm competitions={competitions} />
      </div>

      {highlights.length === 0 ? (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No highlights yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {highlights.map((h) => {
            const vid = youtubeId(h.video_url);
            return (
              <div key={h.id} className="border border-border bg-white rounded overflow-hidden">
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
                  <div className="h-24 bg-surface flex items-center justify-center">
                    <a href={h.video_url} target="_blank" rel="noopener noreferrer" className="text-cobalt text-xs hover:underline">
                      {h.video_url}
                    </a>
                  </div>
                )}
                <div className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {h.competition && (
                      <p className="text-xs text-cobalt font-semibold mb-0.5">{h.competition.name}</p>
                    )}
                    <p className="font-semibold text-navy text-sm truncate">{h.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {new Date(h.published_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <form action={deleteHighlight} className="shrink-0">
                    <input type="hidden" name="id" value={h.id} />
                    <button
                      type="submit"
                      className="text-xs text-danger hover:text-danger/70 transition-colors"
                      onClick={(e) => {
                        if (!confirm("Delete this highlight?")) e.preventDefault();
                      }}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
