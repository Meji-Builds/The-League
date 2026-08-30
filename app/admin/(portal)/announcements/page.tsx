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
      <h1 className="text-2xl font-bold text-navy mb-8">News & Announcements</h1>

      <div className="mb-10">
        <AnnouncementForm />
      </div>

      {posts.length === 0 ? (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No announcements yet. Publish the first one above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <div key={post.id} className="border border-border bg-white rounded p-4 flex items-start gap-4">
              {post.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-16 h-12 object-cover shrink-0 hidden sm:block"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-navy text-sm truncate">{post.title}</p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(post.published_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
                <a
                  href={`/news/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cobalt hover:underline mt-1 inline-block"
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
