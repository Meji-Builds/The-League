import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GenerateInviteForm } from "./GenerateInviteForm";
import { CopyButton } from "./CopyButton";
import { revokeInvite, resetInvite } from "./actions";
import { deleteAllTestData } from "../clubs/actions";

export const metadata = { title: "Admin — Invites" };

interface Invite {
  id: string;
  token: string;
  expected_name: string;
  expected_club_name: string;
  expected_email: string | null;
  note: string | null;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  status: "pending" | "used" | "approved" | "rejected" | "revoked";
  used_by: {
    name: string;
    email: string;
    club_name: string;
    club_faculty: string;
  } | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending:  "text-warning",
  used:     "text-cobalt",
  approved: "text-success",
  rejected: "text-danger",
  revoked:  "text-white/40",
};

const STATUS_DOT: Record<string, string> = {
  pending:  "bg-warning",
  used:     "bg-cobalt",
  approved: "bg-success",
  rejected: "bg-danger",
  revoked:  "bg-white/20",
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function isExpired(invite: Invite) {
  return invite.status === "pending" && new Date(invite.expires_at) < new Date();
}

export default async function InvitesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/admin/login");

  const serviceDb = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = serviceDb as any;

  const { data: rawInvites } = await db
    .from("registration_invites")
    .select("id, token, expected_name, expected_club_name, expected_email, note, expires_at, created_at, used_at, status, used_by_user_id")
    .order("created_at", { ascending: false });

  // Fetch actual registration details for used/approved/rejected invites
  const usedInvites = (rawInvites ?? []).filter(
    (i: { status: string; used_by_user_id: string | null }) => i.used_by_user_id
  );

  const userIds = usedInvites.map((i: { used_by_user_id: string }) => i.used_by_user_id);

  let actualData: Record<string, { name: string; email: string; club_name: string; club_faculty: string }> = {};
  if (userIds.length > 0) {
    const { data: owners } = await db
      .from("club_owners")
      .select("user_id, name, email, club:clubs(name, faculty)")
      .in("user_id", userIds);

    for (const o of (owners ?? [])) {
      actualData[o.user_id] = {
        name:         o.name,
        email:        o.email,
        club_name:    o.club?.name ?? "—",
        club_faculty: o.club?.faculty ?? "—",
      };
    }
  }

  const { data: testClubs } = await db
    .from("clubs")
    .select("id")
    .eq("is_test", true);

  const testClubCount = (testClubs ?? []).length;

  const invites: Invite[] = (rawInvites ?? []).map((i: {
    id: string; token: string; expected_name: string; expected_club_name: string;
    expected_email: string | null; note: string | null; expires_at: string;
    created_at: string; used_at: string | null; status: string; used_by_user_id: string | null;
  }) => ({
    ...i,
    status: i.status as Invite["status"],
    used_by: i.used_by_user_id ? (actualData[i.used_by_user_id] ?? null) : null,
  }));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Invites</h1>
      </div>

      {/* Generate invite */}
      <section className="border border-white/6 bg-card p-5 mb-8 max-w-2xl">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Generate invite link</p>
        <GenerateInviteForm />
      </section>

      {/* Test data nuke */}
      {testClubCount > 0 && (
        <section className="border border-danger/20 bg-danger/5 p-5 mb-8 max-w-2xl">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-danger/70 mb-2">Danger zone</p>
          <p className="text-white text-sm font-medium mb-1">Delete all test data</p>
          <p className="text-white/40 text-xs mb-4">
            This will permanently delete all {testClubCount} test club{testClubCount === 1 ? "" : "s"}, their players, payments, and auth accounts.
            This cannot be undone.
          </p>
          <form action={deleteAllTestData}>
            <button
              type="submit"
              className="text-xs font-semibold px-4 py-2 bg-danger/15 text-danger hover:bg-danger/25 rounded transition-colors"
            >
              Delete all test data ({testClubCount} club{testClubCount === 1 ? "" : "s"})
            </button>
          </form>
        </section>
      )}

      {/* Invite list */}
      <section className="max-w-4xl">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">
          All invites ({invites.length})
        </p>

        {invites.length === 0 ? (
          <div className="border border-white/6 bg-card px-8 py-10 text-center">
            <p className="text-white/40 text-sm">No invites generated yet. Use the form above to create one.</p>
          </div>
        ) : (
          <div className="border border-white/6 divide-y divide-white/5">
            {invites.map((invite) => {
              const expired = isExpired(invite);
              const inviteUrl = `${appUrl}/register?invite=${invite.token}`;

              return (
                <div key={invite.id} className="bg-card p-4">
                  <div className="flex flex-col gap-3">
                    {/* Header row */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${expired ? "bg-white/30" : (STATUS_DOT[invite.status] ?? "bg-white/30")}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${expired ? "text-white/30" : (STATUS_COLOR[invite.status] ?? "text-white/30")}`}>
                            {expired ? "expired" : invite.status}
                          </span>
                        </div>
                        <p className="text-white text-sm font-medium">{invite.expected_name}</p>
                        <p className="text-white/50 text-xs">{invite.expected_club_name}</p>
                        {invite.expected_email && (
                          <p className="text-white/30 text-[11px]">{invite.expected_email}</p>
                        )}
                        {invite.note && (
                          <p className="text-white/30 text-[11px] mt-0.5 italic">{invite.note}</p>
                        )}
                      </div>

                      <div className="text-right text-[11px] text-white/30 shrink-0">
                        <p>Created {fmt(invite.created_at)}</p>
                        <p>Expires {fmt(invite.expires_at)}</p>
                        {invite.used_at && <p>Used {fmt(invite.used_at)}</p>}
                      </div>
                    </div>

                    {/* Actual vs expected for used/approved/rejected */}
                    {invite.used_by && (
                      <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Expected</p>
                          <p className="text-white/60 text-xs">{invite.expected_name}</p>
                          <p className="text-white/40 text-xs">{invite.expected_club_name}</p>
                          {invite.expected_email && <p className="text-white/30 text-[11px]">{invite.expected_email}</p>}
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Actual</p>
                          <p className={`text-xs font-medium ${invite.used_by.name.toLowerCase() !== invite.expected_name.toLowerCase() ? "text-warning" : "text-white"}`}>
                            {invite.used_by.name}
                          </p>
                          <p className={`text-xs ${invite.used_by.club_name.toLowerCase() !== invite.expected_club_name.toLowerCase() ? "text-warning" : "text-white/60"}`}>
                            {invite.used_by.club_name}
                          </p>
                          <p className="text-white/40 text-[11px]">{invite.used_by.club_faculty}</p>
                          <p className="text-white/30 text-[11px]">{invite.used_by.email}</p>
                        </div>
                      </div>
                    )}

                    {/* Action row */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                      {/* Copy link — always visible for pending */}
                      {(invite.status === "pending" && !expired) && (
                        <CopyButton url={inviteUrl} />
                      )}

                      {/* Revoke pending */}
                      {invite.status === "pending" && !expired && (
                        <form action={revokeInvite}>
                          <input type="hidden" name="invite_id" value={invite.id} />
                          <button type="submit" className="text-[11px] font-medium px-3 py-1.5 bg-danger/10 text-danger hover:bg-danger/20 rounded transition-colors">
                            Revoke
                          </button>
                        </form>
                      )}

                      {/* Reset (used / revoked / expired) — makes a fresh pending link */}
                      {(invite.status === "used" || invite.status === "revoked" || expired) && (
                        <form action={resetInvite}>
                          <input type="hidden" name="invite_id" value={invite.id} />
                          <button type="submit" className="text-[11px] font-medium px-3 py-1.5 bg-white/8 text-white/60 hover:bg-white/12 rounded transition-colors">
                            Reset link
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

