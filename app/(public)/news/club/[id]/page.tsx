import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClubPostPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("club_posts")
    .select("id, title, body, image_url, published_at, club:clubs(name, slug)")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (!data) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const post = data as any;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-sm text-dim hover:text-white transition-colors mb-8"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        News
      </Link>

      <div className="mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wide text-gold bg-gold/10 px-2 py-0.5 rounded">
          {post.club?.name ?? "Club"}
        </span>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-bold text-white uppercase leading-snug mb-2">
        {post.title}
      </h1>

      {post.published_at && (
        <p className="text-xs text-dim mb-6">
          {new Date(post.published_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      {post.image_url && (
        <div className="w-full overflow-hidden mb-6 rounded border border-rim">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_url} alt={post.title} className="w-full h-auto" />
        </div>
      )}

      {post.body && (
        <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
          {post.body}
        </div>
      )}
    </div>
  );
}
