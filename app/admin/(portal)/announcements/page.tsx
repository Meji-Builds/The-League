import { createClient } from "@/lib/supabase/server";
import { AnnouncementForm } from "./AnnouncementForm";
import { deleteAnnouncement } from "./actions";
import { DeleteButton } from "@/app/admin/_components/DeleteButton";

export const metadata = { title: "Admin — News" };

interface Announcement {
  id:           string;
  title:        string;
  slug:         string;
  image_url:    string | null;
  published_at: string;
}

export default async function AdminAnnouncementsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const { data } = await db
    .from("announcements")
    .select("id, title, slug, image_url, published_at")
    .order("published_at", { ascending: false });

  const posts = (data ?? []) as Announcement[];

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">News &amp; Announcements</h1>
      </div>

      <div className="mb-10">
        <AnnouncementForm />
      </div>

      {posts.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No announcements yet. Publish the first one above.</p>
        </div>
      ) : (
        <div className="border border-white/6 divide-y divide-white/5">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center gap-4 px-4 py-4">
              {post.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-16 h-12 object-cover shrink-0 hidden sm:block"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{post.title}</p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  {new Date(post.published_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
                <a
                  href={`/news/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-cobalt hover:text-white transition-colors mt-0.5 inline-block"
                >
                  View post
                </a>
              </div>
              <DeleteButton action={deleteAnnouncement} id={post.id} confirm="Delete this announcement?" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
