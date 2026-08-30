import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "News" };

interface NewsItem {
  id: string;
  title: string;
  href: string;
  image_url: string | null;
  published_at: string;
  source: "official" | "club";
  club_name?: string;
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

    const officialItems: NewsItem[] = (announcements ?? []).map((a: any) => ({
      id: a.id,
      title: a.title,
      href: `/news/${a.slug}`,
      image_url: a.image_url,
      published_at: a.published_at,
      source: "official" as const,
    }));

    const clubItems: NewsItem[] = (clubPosts ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      href: `/news/club/${p.id}`,
      image_url: p.image_url,
      published_at: p.published_at,
      source: "club" as const,
      club_name: p.club?.name,
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
      <h1 className="text-3xl font-bold text-navy mb-10">News & Announcements</h1>

      {feed.length === 0 ? (
        <div className="border border-border bg-white px-8 py-14 text-center">
          <p className="text-navy font-semibold">Nothing posted yet.</p>
          <p className="text-muted text-sm mt-2">Official announcements from The League will appear here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {feed.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block bg-white border border-border hover:border-cobalt transition-colors group"
            >
              {item.image_url && (
                <div className="w-full h-44 overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  {item.source === "club" ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gold bg-gold/10 px-1.5 py-0.5 rounded">
                      {item.club_name ?? "Club"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-cobalt bg-cobalt/10 px-1.5 py-0.5 rounded">
                      Official
                    </span>
                  )}
                  <p className="text-xs text-muted">
                    {new Date(item.published_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <h2 className="font-bold text-navy text-base leading-snug group-hover:text-cobalt transition-colors">
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
