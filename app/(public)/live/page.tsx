import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";
import { StreamEmbed } from "./StreamEmbed";

export const metadata = { title: "Live" };

interface LivestreamRow {
  id:    string;
  url:   string;
  title: string;
}

async function getActiveStreams(): Promise<LivestreamRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("livestreams")
      .select("id, url, title")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    return (data ?? []) as LivestreamRow[];
  } catch {
    return [];
  }
}

export default async function LivePage() {
  const [streams, siteSettings] = await Promise.all([getActiveStreams(), getSiteSettings()]);
  const emptyHeading = siteSettings.empty_live_heading;
  const emptyText    = siteSettings.empty_live_text;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
        <h1 className="text-3xl font-bold text-navy">Live Now</h1>
      </div>

      {streams.length === 0 ? (
        <div className="border border-border bg-white px-8 py-20 text-center">
          <p className="text-navy font-semibold text-lg">{emptyHeading}</p>
          <p className="text-muted text-sm mt-2">{emptyText}</p>
        </div>
      ) : (
        <div className={streams.length === 1 ? "max-w-3xl mx-auto" : "grid sm:grid-cols-2 gap-6"}>
          {streams.map((stream) => (
            <div key={stream.id} className="bg-white border border-border overflow-hidden">
              <StreamEmbed url={stream.url} title={stream.title} />

              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <p className="font-semibold text-navy text-sm truncate">{stream.title}</p>
                </div>
                <Link
                  href={stream.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-xs text-cobalt hover:underline"
                >
                  Open fullscreen ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
