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

const statusStyle: Record<string, string> = {
  pending:  "bg-gold/10 text-gold border-gold/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-danger/10 text-danger border-danger/20",
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Club Posts</h1>
        <p className="text-muted text-sm mt-1">Review and approve updates submitted by club owners.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <a
            key={t.value}
            href={`/admin/club-posts?status=${t.value}`}
            className={`text-xs font-semibold px-4 py-1.5 rounded border transition-colors ${
              filterStatus === t.value
                ? "bg-navy text-white border-navy"
                : "border-border bg-white text-navy hover:border-cobalt"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No {filterStatus} posts.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((p) => (
            <div key={p.id} className={`bg-white border rounded overflow-hidden ${statusStyle[p.status] ?? "border-border"}`}>
              {p.image_url && (
                <div className="w-full h-40 overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="text-xs text-muted mb-0.5">
                      {p.club?.name ?? "Unknown club"} &middot;{" "}
                      {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="font-bold text-navy text-sm">{p.title}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${statusStyle[p.status] ?? ""}`}>
                    {p.status}
                  </span>
                </div>

                {p.body && <p className="text-sm text-muted mt-1 mb-4 line-clamp-3">{p.body}</p>}

                <div className="flex flex-wrap gap-2 mt-3">
                  {p.status === "pending" && (
                    <>
                      <form action={approveClubPost}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-xs font-semibold px-4 py-1.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors">
                          Approve
                        </button>
                      </form>
                      <form action={rejectClubPost}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-xs font-semibold px-4 py-1.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
                          Reject
                        </button>
                      </form>
                    </>
                  )}
                  {p.status === "approved" && (
                    <form action={rejectClubPost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-xs font-semibold px-4 py-1.5 rounded bg-warning/10 text-warning hover:bg-warning/20 transition-colors">
                        Revoke
                      </button>
                    </form>
                  )}
                  <DeleteButton
                    action={deleteClubPostAdmin}
                    id={p.id}
                    confirm={`Delete "${p.title}"?`}
                    className="text-xs font-semibold px-4 py-1.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                  >
                    Delete
                  </DeleteButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
