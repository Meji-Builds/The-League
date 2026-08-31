import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Highlights" };

interface Highlight {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  published_at: string;
  competition: { name: string } | null;
}

function youtubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export default async function HighlightsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const { data } = await db
    .from("highlights")
    .select("id, title, video_url, thumbnail_url, published_at, competition:competitions(name)")
    .order("published_at", { ascending: false });

  const highlights = (data ?? []) as Highlight[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">The League</p>
        <h1 className="font-display font-black text-[2.5rem] text-white uppercase leading-none">Highlights</h1>
        <p className="text-white/40 text-sm mt-2">Match VODs and moments from the season.</p>
      </div>

      {highlights.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-16 text-center">
          <p className="text-white font-semibold">No highlights yet.</p>
          <p className="text-white/35 text-sm mt-2">Match VODs will be posted here during the season.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
          {highlights.map((h) => {
            const vid = youtubeId(h.video_url);
            return (
              <div key={h.id} className="bg-card overflow-hidden flex flex-col">
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
                  <a href={h.video_url} target="_blank" rel="noopener noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.thumbnail_url} alt={h.title} className="w-full h-44 object-cover hover:opacity-80 transition-opacity" />
                  </a>
                ) : (
                  <a
                    href={h.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-44 bg-white/5 items-center justify-center gap-2 text-cobalt text-sm font-medium hover:text-white hover:bg-white/8 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Watch video
                  </a>
                )}
                <div className="p-4 border-t border-white/5 flex-1">
                  {h.competition && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cobalt mb-1">{h.competition.name}</p>
                  )}
                  <p className="font-semibold text-white text-sm leading-snug">{h.title}</p>
                  <p className="text-[11px] text-white/30 mt-1.5">
                    {new Date(h.published_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
