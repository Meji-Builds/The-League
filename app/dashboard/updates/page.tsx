import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatePostForm } from "./CreatePostForm";
import { DeleteButton } from "@/app/admin/_components/DeleteButton";
import { deleteClubPost } from "./actions";

export const metadata = { title: "Club Updates" };

const statusStyle: Record<string, string> = {
  pending:  "bg-gold/10 text-gold",
  approved: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
};

interface ClubPost {
  id:         string;
  title:      string;
  body:       string | null;
  image_url:  string | null;
  status:     string;
  created_at: string;
}

export default async function UpdatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: owner } = await db
    .from("club_owners")
    .select("club_id")
    .eq("user_id", user.id)
    .single();

  if (!owner?.club_id) redirect("/dashboard/onboarding");

  const { data: rawPosts } = await db
    .from("club_posts")
    .select("id, title, body, image_url, status, created_at")
    .eq("club_id", owner.club_id)
    .order("created_at", { ascending: false });

  const posts = (rawPosts ?? []) as ClubPost[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Club Updates</h1>
        <p className="text-muted text-sm mt-1">
          Post news and updates from your club. Each post is reviewed by admin before it appears publicly.
        </p>
      </div>

      <CreatePostForm />

      {posts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-4">Your Posts</h2>
          <div className="flex flex-col gap-4">
            {posts.map((p) => (
              <div key={p.id} className="bg-white border border-border rounded p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${statusStyle[p.status] ?? ""}`}>
                      {p.status}
                    </span>
                    <p className="text-xs text-muted">
                      {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <p className="font-semibold text-navy text-sm">{p.title}</p>
                  {p.body && <p className="text-xs text-muted mt-1 line-clamp-2">{p.body}</p>}
                </div>
                {p.status === "pending" && (
                  <DeleteButton
                    action={deleteClubPost}
                    id={p.id}
                    confirm="Delete this post?"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
