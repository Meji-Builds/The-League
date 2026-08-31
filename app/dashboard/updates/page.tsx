import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatePostForm } from "./CreatePostForm";
import { DeleteButton } from "@/app/admin/_components/DeleteButton";
import { deleteClubPost } from "./actions";

export const metadata = { title: "Club Updates" };

const STATUS_DOT: Record<string, string> = {
  pending:  "bg-warning",
  approved: "bg-success",
  rejected: "bg-danger",
};

const STATUS_TEXT: Record<string, string> = {
  pending:  "text-warning",
  approved: "text-success",
  rejected: "text-danger",
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
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Dashboard</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Club Updates</h1>
        <p className="text-white/40 text-[13px] mt-2">
          Post news and updates from your club. Each post is reviewed by admin before it appears publicly.
        </p>
      </div>

      <CreatePostForm clubId={owner.club_id} />

      {posts.length > 0 && (
        <div className="mt-8">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Your Posts</p>
          <div className="border border-white/6 divide-y divide-white/5">
            {posts.map((p) => (
              <div key={p.id} className="bg-card flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status] ?? "bg-white/30"}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] capitalize ${STATUS_TEXT[p.status] ?? "text-white/30"}`}>
                        {p.status}
                      </span>
                    </span>
                    <span className="text-[11px] text-white/30">
                      {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="font-medium text-white text-sm">{p.title}</p>
                  {p.body && <p className="text-[13px] text-white/40 mt-1 line-clamp-2">{p.body}</p>}
                </div>
                {p.status === "pending" && (
                  <DeleteButton action={deleteClubPost} id={p.id} confirm="Delete this post?" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
