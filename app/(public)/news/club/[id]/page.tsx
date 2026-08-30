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
  const post = data as any;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/news" className="text-xs text-muted hover:text-navy transition-colors mb-6 inline-block">
        &larr; News
      </Link>

      <div className="mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gold bg-gold/10 px-1.5 py-0.5 rounded">
          {post.club?.name ?? "Club"}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-navy mb-2 leading-snug">{post.title}</h1>

      {post.published_at && (
        <p className="text-xs text-muted mb-6">
          {new Date(post.published_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      {post.image_url && (
        <div className="w-full overflow-hidden mb-6 border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_url} alt={post.title} className="w-full h-auto" />
        </div>
      )}

      {post.body && (
        <div className="prose prose-sm max-w-none text-navy/80 leading-relaxed whitespace-pre-wrap">
          {post.body}
        </div>
      )}
    </div>
  );
}
