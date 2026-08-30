import { createClient } from "@/lib/supabase/server";
import { approveClub, suspendClub, approvePlayer, rejectPlayer, approveClubLogo, rejectClubLogo } from "./actions";
import { BannerUploadForm } from "./BannerUploadForm";

export const metadata = { title: "Admin — Clubs" };

interface Club {
  id: string;
  name: string;
  faculty: string;
  status: string;
  created_at: string;
  banner_image_url: string | null;
  logo_url: string | null;
  logo_status: string | null;
  owner: { name: string; email: string } | null;
}

interface Player {
  id: string;
  gamer_tag: string;
  full_name: string | null;
  id_card_url: string | null;
  id_card_status: string;
  club: { id: string; name: string; faculty: string } | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:  "bg-warning/10 text-warning",
    approved: "bg-success/10 text-success",
    suspended: "bg-danger/10 text-danger",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded capitalize ${styles[status] ?? "bg-muted/10 text-muted"}`}>
      {status}
    </span>
  );
}

function ActionForm({ action, clubId, label, className }: { action: typeof approveClub | typeof suspendClub; clubId: string; label: string; className: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="club_id" value={clubId} />
      <button type="submit" className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${className}`}>
        {label}
      </button>
    </form>
  );
}

function idCardPath(urlOrPath: string): string {
  const marker = "/id-cards/";
  const idx = urlOrPath.indexOf(marker);
  return idx >= 0 ? urlOrPath.slice(idx + marker.length) : urlOrPath;
}

export default async function AdminClubsPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: rawClubs } = await db
    .from("clubs")
    .select("id, name, faculty, status, created_at, banner_image_url, logo_url, logo_status, owner:club_owners(name, email)")
    .order("created_at", { ascending: false });

  const clubs = (rawClubs ?? []) as Club[];

  const { data: rawPlayers } = await db
    .from("players")
    .select("id, gamer_tag, full_name, id_card_url, id_card_status, club:clubs(id, name, faculty)")
    .eq("id_card_status", "pending")
    .order("created_at", { ascending: false });

  const rawPendingPlayers = (rawPlayers ?? []) as Player[];

  // Generate 1-hour signed URLs for each pending player's ID card (private bucket).
  const pendingPlayers = await Promise.all(
    rawPendingPlayers.map(async (player) => {
      if (!player.id_card_url) return player;
      const path = idCardPath(player.id_card_url);
      const { data } = await supabase.storage.from("id-cards").createSignedUrl(path, 3600);
      return { ...player, id_card_url: data?.signedUrl ?? null };
    })
  );

  const pending  = clubs.filter((c) => c.status === "pending");
  const approved = clubs.filter((c) => c.status === "approved");
  const suspended = clubs.filter((c) => c.status === "suspended");

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-8">Clubs</h1>

      {/* Pending player ID card verifications */}
      {pendingPlayers.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
            Player ID cards — awaiting review ({pendingPlayers.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pendingPlayers.map((player) => (
              <div key={player.id} className="border border-warning/30 bg-white rounded p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-navy text-sm">{player.gamer_tag}</p>
                  {player.full_name && <p className="text-muted text-xs mt-0.5">{player.full_name}</p>}
                  <p className="text-xs text-muted mt-1">
                    {player.club?.name} &middot; {player.club?.faculty}
                  </p>
                </div>

                {player.id_card_url && (
                  <a
                    href={player.id_card_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-24 h-16 border border-border rounded overflow-hidden bg-surface flex-shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={player.id_card_url}
                      alt="Student ID card"
                      className="w-full h-full object-cover"
                    />
                  </a>
                )}

                <div className="flex gap-2 sm:flex-col">
                  <form action={approvePlayer}>
                    <input type="hidden" name="player_id" value={player.id} />
                    <button type="submit" className="text-xs font-semibold px-3 py-1 rounded bg-success/10 text-success hover:bg-success/20 transition-colors w-full">
                      Approve
                    </button>
                  </form>
                  <form action={rejectPlayer}>
                    <input type="hidden" name="player_id" value={player.id} />
                    <button type="submit" className="text-xs font-semibold px-3 py-1 rounded bg-danger/10 text-danger hover:bg-danger/20 transition-colors w-full">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending club logo approvals */}
      {clubs.filter((c) => c.logo_status === "pending").length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
            Club logos — awaiting review ({clubs.filter((c) => c.logo_status === "pending").length})
          </h2>
          <div className="flex flex-col gap-3">
            {clubs.filter((c) => c.logo_status === "pending").map((club) => (
              <div key={club.id} className="border border-warning/30 bg-white rounded p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-navy text-sm">{club.name}</p>
                  <p className="text-muted text-xs mt-0.5">{club.faculty}</p>
                </div>
                {club.logo_url && (
                  <a href={club.logo_url} target="_blank" rel="noopener noreferrer"
                    className="block w-16 h-16 border border-border rounded overflow-hidden bg-surface flex-shrink-0 p-1"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={club.logo_url} alt="Club logo" className="w-full h-full object-contain" />
                  </a>
                )}
                <div className="flex gap-2 sm:flex-col">
                  <form action={approveClubLogo}>
                    <input type="hidden" name="club_id" value={club.id} />
                    <button type="submit" className="text-xs font-semibold px-3 py-1 rounded bg-success/10 text-success hover:bg-success/20 transition-colors w-full">
                      Approve
                    </button>
                  </form>
                  <form action={rejectClubLogo}>
                    <input type="hidden" name="club_id" value={club.id} />
                    <button type="submit" className="text-xs font-semibold px-3 py-1 rounded bg-danger/10 text-danger hover:bg-danger/20 transition-colors w-full">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending club registrations */}
      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
            Pending registration ({pending.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map((club) => (
              <ClubRow key={club.id} club={club} />
            ))}
          </div>
        </section>
      )}

      {/* Approved clubs */}
      {approved.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
            Active clubs ({approved.length})
          </h2>
          <div className="flex flex-col gap-3">
            {approved.map((club) => (
              <ClubRow key={club.id} club={club} />
            ))}
          </div>
        </section>
      )}

      {/* Suspended clubs */}
      {suspended.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
            Suspended ({suspended.length})
          </h2>
          <div className="flex flex-col gap-3">
            {suspended.map((club) => (
              <ClubRow key={club.id} club={club} />
            ))}
          </div>
        </section>
      )}

      {clubs.length === 0 && (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No clubs registered yet.</p>
        </div>
      )}
    </div>
  );
}

function ClubRow({ club }: { club: Club }) {
  return (
    <div className="border border-border bg-white rounded p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-navy text-sm">{club.name}</p>
            <StatusBadge status={club.status} />
          </div>
          <p className="text-xs text-muted">{club.faculty}</p>
          {club.owner && (
            <p className="text-xs text-muted mt-0.5">{club.owner.name} &middot; {club.owner.email}</p>
          )}
        </div>

        <div className="flex gap-2">
          {club.status !== "approved" && (
            <ActionForm
              action={approveClub}
              clubId={club.id}
              label="Approve"
              className="bg-success/10 text-success hover:bg-success/20"
            />
          )}
          {club.status !== "suspended" && (
            <ActionForm
              action={suspendClub}
              clubId={club.id}
              label="Suspend"
              className="bg-danger/10 text-danger hover:bg-danger/20"
            />
          )}
        </div>
      </div>

      <BannerUploadForm clubId={club.id} currentBannerUrl={club.banner_image_url} />
    </div>
  );
}
