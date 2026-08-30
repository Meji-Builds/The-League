import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Announcement {
  id:           string;
  title:        string;
  slug:         string;
  body:         string;
  image_url:    string | null;
  published_at: string;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("announcements").select("title").eq("slug", slug).single();
  return { title: data?.title ?? "News" };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("id, title, slug, body, image_url, published_at")
    .eq("slug", slug)
    .single();

  if (!data) notFound();

  const post = data as Announcement;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-sm text-dim hover:text-white transition-colors mb-8"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All news
      </Link>

      <p className="text-cobalt text-xs font-bold uppercase tracking-[0.2em] mb-3">News</p>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-white uppercase leading-tight mb-4">
        {post.title}
      </h1>

      <p className="text-dim text-sm mb-8">
        {new Date(post.published_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      {post.image_url && (
        <div className="w-full mb-8 overflow-hidden rounded border border-rim">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      <div className="space-y-4">
        {post.body.split("\n\n").map((paragraph, i) => (
          <p key={i} className="text-white/80 text-sm leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
