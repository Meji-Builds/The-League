import { createClient } from "@/lib/supabase/server";
import { approveClub, suspendClub, approvePlayer, rejectPlayer, approveClubLogo, rejectClubLogo, approvePlayerPhoto, rejectPlayerPhoto } from "./actions";
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
  profile_picture_url: string | null;
  profile_picture_status: string;
  club: { id: string; name: string; faculty: string } | null;
}

const STATUS_DOT: Record<string, string> = {
  pending:   "bg-warning",
  approved:  "bg-success",
  suspended: "bg-danger",
};

const STATUS_TEXT: Record<string, string> = {
  pending:   "text-warning",
  approved:  "text-success",
  suspended: "text-danger",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-white/30"}`} />
      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${STATUS_TEXT[status] ?? "text-white/30"}`}>{status}</span>
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
    .select("id, gamer_tag, full_name, id_card_url, id_card_status, profile_picture_url, profile_picture_status, club:clubs(id, name, faculty)")
    .eq("id_card_status", "pending")
    .order("created_at", { ascending: false });

  const rawPendingPlayers = (rawPlayers ?? []) as Player[];

  const { data: rawPhotoPlayers } = await db
    .from("players")
    .select("id, gamer_tag, full_name, id_card_url, id_card_status, profile_picture_url, profile_picture_status, club:clubs(id, name, faculty)")
    .eq("profile_picture_status", "pending")
    .order("created_at", { ascending: false });

  const pendingPhotoPlayers = (rawPhotoPlayers ?? []) as Player[];


  const pendingPlayers = await Promise.all(
    rawPendingPlayers.map(async (player) => {
      if (!player.id_card_url) return player;
      const path = idCardPath(player.id_card_url);
      const { data } = await supabase.storage.from("id-cards").createSignedUrl(path, 3600);
      return { ...player, id_card_url: data?.signedUrl ?? null };
    })
  );

  const pending      = clubs.filter((c) => c.status === "pending");
  const approved     = clubs.filter((c) => c.status === "approved");
  const suspended    = clubs.filter((c) => c.status === "suspended");
  const pendingLogos = clubs.filter((c) => c.logo_status === "pending");

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Clubs</h1>
      </div>

      {/* Pending player ID card verifications */}
      {pendingPlayers.length > 0 && (
        <section className="mb-10">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">
            Player ID cards — awaiting review ({pendingPlayers.length})
          </p>
          <div className="border border-warning/20 border-l-[3px] border-l-warning divide-y divide-white/5">
            {pendingPlayers.map((player) => (
              <div key={player.id} className="bg-card flex flex-col sm:flex-row sm:items-start gap-4 p-4">
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{player.gamer_tag}</p>
                  {player.full_name && <p className="text-white/40 text-xs mt-0.5">{player.full_name}</p>}
                  <p className="text-[11px] text-white/30 mt-1">
                    {player.club?.name} &middot; {player.club?.faculty}
                  </p>
                </div>

                {player.id_card_url && (
                  <a
                    href={player.id_card_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-24 h-16 border border-white/10 overflow-hidden bg-white/5 flex-shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={player.id_card_url} alt="Student ID card" className="w-full h-full object-cover" />
                  </a>
                )}

                <div className="flex gap-2 sm:flex-col">
                  <form action={approvePlayer}>
                    <input type="hidden" name="player_id" value={player.id} />
                    <button type="submit" className="text-xs font-semibold px-3 py-1 bg-success/10 text-success hover:bg-success/20 transition-colors rounded w-full">
                      Approve
                    </button>
                  </form>
                  <form action={rejectPlayer}>
                    <input type="hidden" name="player_id" value={player.id} />
                    <button type="submit" className="text-xs font-semibold px-3 py-1 bg-danger/10 text-danger hover:bg-danger/20 transition-colors rounded w-full">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending player photo verifications */}
      {pendingPhotoPlayers.length > 0 && (
        <section className="mb-10">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">
            Player photos — awaiting review ({pendingPhotoPlayers.length})
          </p>
          <div className="border border-warning/20 border-l-[3px] border-l-warning divide-y divide-white/5">
            {pendingPhotoPlayers.map((player) => (
              <div key={player.id} className="bg-card flex flex-col sm:flex-row sm:items-start gap-4 p-4">
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{player.gamer_tag}</p>
                  {player.full_name && <p className="text-white/40 text-xs mt-0.5">{player.full_name}</p>}
                  <p className="text-[11px] text-white/30 mt-1">
                    {player.club?.name} &middot; {player.club?.faculty}
                  </p>
                </div>

                {player.profile_picture_url && (
                  <a
                    href={player.profile_picture_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-16 h-16 border border-white/10 overflow-hidden bg-white/5 flex-shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={player.profile_picture_url} alt="Player photo" className="w-full h-full object-cover" />
                  </a>
                )}

                <div className="flex gap-2 sm:flex-col">
                  <form action={approvePlayerPhoto}>
                    <input type="hidden" name="player_id" value={player.id} />
                    <button type="submit" className="text-xs font-semibold px-3 py-1 bg-success/10 text-success hover:bg-success/20 transition-colors rounded w-full">
                      Approve
                    </button>
                  </form>
                  <form action={rejectPlayerPhoto}>
                    <input type="hidden" name="player_id" value={player.id} />
                    <button type="submit" className="text-xs font-semibold px-3 py-1 bg-danger/10 text-danger hover:bg-danger/20 transition-colors rounded w-full">
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
      {pendingLogos.length > 0 && (
        <section className="mb-10">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">
            Club logos — awaiting review ({pendingLogos.length})
          </p>
          <div className="border border-warning/20 border-l-[3px] border-l-warning divide-y divide-white/5">
            {pendingLogos.map((club) => (
              <div key={club.id} className="bg-card flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{club.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{club.faculty}</p>
                </div>
                {club.logo_url && (
                  <a
                    href={club.logo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-16 h-16 border border-white/10 overflow-hidden bg-white/5 flex-shrink-0 p-1"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={club.logo_url} alt="Club logo" className="w-full h-full object-contain" />
                  </a>
                )}
                <div className="flex gap-2 sm:flex-col">
                  <form action={approveClubLogo}>
                    <input type="hidden" name="club_id" value={club.id} />
                    <button type="submit" className="text-xs font-semibold px-3 py-1 bg-success/10 text-success hover:bg-success/20 transition-colors rounded w-full">
                      Approve
                    </button>
                  </form>
                  <form action={rejectClubLogo}>
                    <input type="hidden" name="club_id" value={club.id} />
                    <button type="submit" className="text-xs font-semibold px-3 py-1 bg-danger/10 text-danger hover:bg-danger/20 transition-colors rounded w-full">
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
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">
            Pending registration ({pending.length})
          </p>
          <div className="border border-white/6 divide-y divide-white/5">
            {pending.map((club) => <ClubRow key={club.id} club={club} />)}
          </div>
        </section>
      )}

      {/* Approved clubs */}
      {approved.length > 0 && (
        <section className="mb-10">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">
            Active clubs ({approved.length})
          </p>
          <div className="border border-white/6 divide-y divide-white/5">
            {approved.map((club) => <ClubRow key={club.id} club={club} />)}
          </div>
        </section>
      )}

      {/* Suspended clubs */}
      {suspended.length > 0 && (
        <section className="mb-10">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">
            Suspended ({suspended.length})
          </p>
          <div className="border border-white/6 divide-y divide-white/5">
            {suspended.map((club) => <ClubRow key={club.id} club={club} />)}
          </div>
        </section>
      )}

      {clubs.length === 0 && (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No clubs registered yet.</p>
        </div>
      )}
    </div>
  );
}

function ClubRow({ club }: { club: Club }) {
  return (
    <div className="bg-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-0.5">
            <p className="font-medium text-white text-sm">{club.name}</p>
            <StatusBadge status={club.status} />
          </div>
          <p className="text-[11px] text-white/40">{club.faculty}</p>
          {club.owner && (
            <p className="text-[11px] text-white/30 mt-0.5">{club.owner.name} &middot; {club.owner.email}</p>
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
