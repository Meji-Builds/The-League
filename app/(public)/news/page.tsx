import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "News" };

interface NewsItem {
  id:           string;
  title:        string;
  href:         string;
  image_url:    string | null;
  published_at: string;
  source:       "official" | "club";
  club_name?:   string;
}

async function getFeed(): Promise<NewsItem[]> {
  try {
    const supabase = await createClient();
    const [{ data: announcements }, { data: clubPosts }] = await Promise.all([
      supabase
        .from("announcements")
        .select("id, title, slug, image_url, published_at")
        .order("published_at", { ascending: false })
        .limit(20),
      supabase
        .from("club_posts")
        .select("id, title, image_url, published_at, club:clubs(name)")
        .eq("status", "approved")
        .order("published_at", { ascending: false })
        .limit(30),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const officialItems: NewsItem[] = (announcements ?? []).map((a: any) => ({
      id:           a.id,
      title:        a.title,
      href:         `/news/${a.slug}`,
      image_url:    a.image_url,
      published_at: a.published_at,
      source:       "official" as const,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clubItems: NewsItem[] = (clubPosts ?? []).map((p: any) => ({
      id:           p.id,
      title:        p.title,
      href:         `/news/club/${p.id}`,
      image_url:    p.image_url,
      published_at: p.published_at,
      source:       "club" as const,
      club_name:    p.club?.name,
    }));

    return [...officialItems, ...clubItems].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  const feed = await getFeed();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl font-bold text-white uppercase tracking-tight mb-10">
        News &amp; Announcements
      </h1>

      {feed.length === 0 ? (
        <div className="border border-rim bg-card px-8 py-14 text-center rounded">
          <p className="text-white font-semibold">Nothing posted yet.</p>
          <p className="text-dim text-sm mt-2">Official announcements from The League will appear here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {feed.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block bg-card border border-rim hover:border-cobalt/50 transition-all group rounded overflow-hidden"
            >
              {item.image_url ? (
                <div className="w-full h-44 overflow-hidden bg-panel">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-full h-44 bg-gold/5 flex items-center justify-center border-b border-rim">
                  <span className="text-gold/40 text-xs font-bold uppercase tracking-widest">The League</span>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  {item.source === "club" ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gold bg-gold/10 px-1.5 py-0.5 rounded">
                      {item.club_name ?? "Club"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-cobalt bg-cobalt/10 px-1.5 py-0.5 rounded">
                      Official
                    </span>
                  )}
                  <p className="text-xs text-dim">
                    {new Date(item.published_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <h2 className="font-bold text-white text-sm leading-snug group-hover:text-gold transition-colors line-clamp-2">
                  {item.title}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
