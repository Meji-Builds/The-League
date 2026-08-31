import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddPlayerForm } from "./AddPlayerForm";
import { RemoveButton } from "./RemoveButton";
import { PlayerPhotoForm } from "./PlayerPhotoForm";

export const metadata = { title: "Roster" };

interface Player {
  id: string;
  gamer_tag: string;
  full_name: string | null;
  position: string | null;
  id_card_status: string;
  profile_picture_url: string | null;
  profile_picture_status: string;
  stats: { matches_played: number; wins: number; losses: number };
}

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

export default async function RosterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: owner } = await db
    .from("club_owners")
    .select("club_id, club:clubs(name, faculty)")
    .eq("user_id", user.id)
    .single();

  if (!owner?.club_id) redirect("/dashboard/onboarding");

  const { data: feeRow } = await db
    .from("fee_settings")
    .select("max_players_per_club")
    .eq("id", 1)
    .single();
  const cap: number = feeRow?.max_players_per_club ?? 15;

  const { data: rawPlayers } = await db
    .from("players")
    .select("id, gamer_tag, full_name, position, id_card_status, profile_picture_url, profile_picture_status, stats")
    .eq("club_id", owner.club_id)
    .order("gamer_tag");

  const players = (rawPlayers ?? []) as Player[];

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Dashboard</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Roster</h1>
        <p className="text-white/40 text-[13px] mt-2">
          {owner.club?.name} &middot; {owner.club?.faculty} &middot; {players.length} / {cap} players
        </p>
      </div>

      <div className="mb-8">
        <AddPlayerForm cap={cap} count={players.length} />
      </div>

      {players.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No players yet. Add your first player above.</p>
        </div>
      ) : (
        <div className="border border-white/6 divide-y divide-white/5">
          {players.map((player) => (
            <div key={player.id} className="bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1">
                    <span className="font-medium text-white text-[13px]">{player.gamer_tag}</span>
                    {player.full_name && (
                      <span className="text-white/40 text-[12px]">{player.full_name}</span>
                    )}
                    {player.position && (
                      <span className="text-white/30 text-[11px]">{player.position}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[9px] text-white/30 uppercase tracking-wide font-semibold">ID</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[player.id_card_status] ?? "bg-white/30"}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] capitalize ${STATUS_TEXT[player.id_card_status] ?? "text-white/30"}`}>
                        {player.id_card_status}
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5">
                      <span className="text-[9px] text-white/30 uppercase tracking-wide font-semibold">Photo</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[player.profile_picture_status] ?? "bg-white/30"}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] capitalize ${STATUS_TEXT[player.profile_picture_status] ?? "text-white/30"}`}>
                        {player.profile_picture_status === "none" ? "not uploaded" : player.profile_picture_status}
                      </span>
                    </span>

                    <span className="text-white/30 text-[11px]">
                      {player.stats.wins}W / {player.stats.losses}L
                    </span>
                  </div>

                  <PlayerPhotoForm
                    playerId={player.id}
                    currentPhotoUrl={player.profile_picture_url}
                    currentStatus={player.profile_picture_status}
                  />
                </div>

                <RemoveButton playerId={player.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
