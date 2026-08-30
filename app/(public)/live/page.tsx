import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Live" };

interface LivestreamRow {
  id:        string;
  url:       string;
  title:     string;
  is_active: boolean;
}

function youtubeEmbedId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

async function getActiveStreams(): Promise<LivestreamRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("livestreams")
      .select("id, url, title, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    return (data ?? []) as LivestreamRow[];
  } catch {
    return [];
  }
}

export default async function LivePage() {
  const streams = await getActiveStreams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
        <h1 className="text-3xl font-bold text-navy">Live Now</h1>
      </div>

      {streams.length === 0 ? (
        <div className="border border-border bg-white px-8 py-20 text-center">
          <p className="text-navy font-semibold text-lg">No live streams right now.</p>
          <p className="text-muted text-sm mt-2">Check back during scheduled match days.</p>
        </div>
      ) : (
        <div className={streams.length === 1 ? "" : "grid sm:grid-cols-2 gap-6"}>
          {streams.map((stream) => {
            const embedId = youtubeEmbedId(stream.url);
            return (
              <div key={stream.id} className="bg-white border border-border overflow-hidden">
                {embedId ? (
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${embedId}?autoplay=0`}
                      title={stream.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={stream.url}
                      title={stream.title}
                      allowFullScreen
                    />
                  </div>
                )}
                <div className="px-4 py-3 flex items-center gap-2">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <p className="font-semibold text-navy text-sm">{stream.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
