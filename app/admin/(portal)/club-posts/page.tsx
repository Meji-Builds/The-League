import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/app/admin/_components/DeleteButton";
import { approveClubPost, rejectClubPost, deleteClubPostAdmin } from "./actions";

export const metadata = { title: "Admin — Club Posts" };

interface ClubPost {
  id:         string;
  title:      string;
  body:       string | null;
  image_url:  string | null;
  status:     string;
  created_at: string;
  club:       { name: string; slug: string } | null;
}

const STATUS_LEFT: Record<string, string> = {
  pending:  "border-l-warning",
  approved: "border-l-success",
  rejected: "border-l-danger",
};

const STATUS_TEXT_COLOR: Record<string, string> = {
  pending:  "text-warning",
  approved: "text-success",
  rejected: "text-danger",
};

export default async function AdminClubPostsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: filterStatus = "pending" } = await searchParams;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const { data: rawPosts } = await db
    .from("club_posts")
    .select("id, title, body, image_url, status, created_at, club:clubs(name, slug)")
    .eq("status", filterStatus)
    .order("created_at", { ascending: false });

  const posts = (rawPosts ?? []) as ClubPost[];

  const tabs = [
    { label: "Pending",  value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Club Posts</h1>
        <p className="text-white/40 text-[13px] mt-2">Review and approve updates submitted by club owners.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <a
            key={t.value}
            href={`/admin/club-posts?status=${t.value}`}
            className={`text-xs font-semibold px-4 py-1.5 border transition-colors ${
              filterStatus === t.value
                ? "bg-cobalt text-navy border-cobalt"
                : "border-white/10 text-white/40 hover:text-white hover:border-white/30"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No {filterStatus} posts.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((p) => (
            <div
              key={p.id}
              className={`bg-card border border-white/6 border-l-[3px] overflow-hidden ${STATUS_LEFT[p.status] ?? "border-l-white/10"}`}
            >
              {p.image_url && (
                <div className="w-full h-40 overflow-hidden bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="text-[11px] text-white/30 mb-0.5">
                      {p.club?.name ?? "Unknown club"} &middot;{" "}
                      {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="font-medium text-white text-sm">{p.title}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] capitalize ${STATUS_TEXT_COLOR[p.status] ?? "text-white/30"}`}>
                    {p.status}
                  </span>
                </div>

                {p.body && <p className="text-[13px] text-white/40 mt-1 mb-4 line-clamp-3">{p.body}</p>}

                <div className="flex flex-wrap gap-2 mt-3">
                  {p.status === "pending" && (
                    <>
                      <form action={approveClubPost}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-xs font-semibold px-4 py-1.5 bg-success/10 text-success hover:bg-success/20 transition-colors">
                          Approve
                        </button>
                      </form>
                      <form action={rejectClubPost}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-xs font-semibold px-4 py-1.5 bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
                          Reject
                        </button>
                      </form>
                    </>
                  )}
                  {p.status === "approved" && (
                    <form action={rejectClubPost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-xs font-semibold px-4 py-1.5 bg-warning/10 text-warning hover:bg-warning/20 transition-colors">
                        Revoke
                      </button>
                    </form>
                  )}
                  <DeleteButton action={deleteClubPostAdmin} id={p.id} confirm={`Delete "${p.title}"?`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
