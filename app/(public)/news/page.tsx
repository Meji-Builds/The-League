import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "News" };

interface AnnouncementRow {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  published_at: string;
}

async function getAnnouncements(): Promise<AnnouncementRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("announcements")
      .select("id, title, slug, image_url, published_at")
      .order("published_at", { ascending: false })
      .limit(20);
    return (data ?? []) as unknown as AnnouncementRow[];
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  const posts = await getAnnouncements();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-navy mb-10">News & Announcements</h1>

      {posts.length === 0 ? (
        <div className="border border-border bg-white px-8 py-14 text-center">
          <p className="text-navy font-semibold">Nothing posted yet.</p>
          <p className="text-muted text-sm mt-2">Official announcements from The League will appear here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/news/${post.slug}`}
              className="block bg-white border border-border hover:border-cobalt transition-colors group"
            >
              {post.image_url && (
                <div className="w-full h-44 overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <p className="text-xs text-muted mb-2">
                  {new Date(post.published_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <h2 className="font-bold text-navy text-base leading-snug group-hover:text-cobalt transition-colors">
                  {post.title}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
