import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Highlights" };

interface HighlightWithCompetition {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  published_at: string;
  competition: { name: string } | null;
}

async function getHighlights(): Promise<HighlightWithCompetition[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("highlights")
      .select("*, competition:competitions(name)")
      .order("published_at", { ascending: false });
    return (data ?? []) as unknown as HighlightWithCompetition[];
  } catch {
    return [];
  }
}

// Extract a YouTube video ID from a full YouTube URL
function youtubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export default async function HighlightsPage() {
  const highlights = await getHighlights();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-navy mb-2">Highlights</h1>
      <p className="text-muted text-sm mb-10">Match VODs and moments from The League.</p>

      {highlights.length === 0 ? (
        <div className="border border-border bg-white px-8 py-14 text-center">
          <p className="text-navy font-semibold">No highlights yet.</p>
          <p className="text-muted text-sm mt-2">Match VODs will be posted here during the season.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((h) => {
            const videoId = youtubeId(h.video_url);
            return (
              <div key={h.id} className="bg-white border border-border overflow-hidden">
                {videoId ? (
                  <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={h.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    href={h.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-44 bg-surface flex items-center justify-center text-cobalt font-medium text-sm hover:bg-border transition-colors"
                  >
                    Watch video
                  </a>
                )}
                <div className="p-4">
                  {h.competition && (
                    <p className="text-xs text-cobalt font-semibold mb-1">{h.competition.name}</p>
                  )}
                  <p className="font-semibold text-navy text-sm">{h.title}</p>
                  <p className="text-xs text-muted mt-1">
                    {new Date(h.published_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
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
