import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddPlayerForm } from "./AddPlayerForm";
import { RemoveButton } from "./RemoveButton";

export const metadata = { title: "Roster" };

interface Player {
  id: string;
  gamer_tag: string;
  full_name: string | null;
  position: string | null;
  id_card_status: string;
  stats: { matches_played: number; wins: number; losses: number };
}

const ID_CARD_DOT: Record<string, string> = {
  pending:  "bg-warning",
  approved: "bg-success",
  rejected: "bg-danger",
};

const ID_CARD_TEXT: Record<string, string> = {
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

  const { data: rawPlayers } = await db
    .from("players")
    .select("id, gamer_tag, full_name, position, id_card_status, stats")
    .eq("club_id", owner.club_id)
    .order("gamer_tag");

  const players = (rawPlayers ?? []) as Player[];

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Dashboard</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Roster</h1>
        <p className="text-white/40 text-[13px] mt-2">
          {owner.club?.name} &middot; {owner.club?.faculty} &middot; {players.length} {players.length === 1 ? "player" : "players"}
        </p>
      </div>

      <div className="mb-8">
        <AddPlayerForm />
      </div>

      {players.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No players yet. Add your first player above.</p>
        </div>
      ) : (
        <div className="border border-white/6 overflow-hidden">
          <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr className="border-b border-white/6 bg-white/[0.02]">
                <th className="text-left text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-5 py-3">
                  Gamer tag
                </th>
                <th className="text-left text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-5 py-3 hidden sm:table-cell">
                  Full name
                </th>
                <th className="text-left text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-5 py-3 hidden md:table-cell">
                  Position
                </th>
                <th className="text-left text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-5 py-3">
                  ID card
                </th>
                <th className="text-right text-[9px] font-bold uppercase tracking-[0.35em] text-dim px-5 py-3 hidden md:table-cell">
                  W / L
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-white text-[13px]">{player.gamer_tag}</td>
                  <td className="px-5 py-3.5 text-white/40 text-[13px] hidden sm:table-cell">
                    {player.full_name ?? <span className="text-white/20">-</span>}
                  </td>
                  <td className="px-5 py-3.5 text-white/40 text-[13px] hidden md:table-cell">
                    {player.position ?? <span className="text-white/20">-</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${ID_CARD_DOT[player.id_card_status] ?? "bg-white/30"}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] capitalize ${ID_CARD_TEXT[player.id_card_status] ?? "text-white/30"}`}>
                        {player.id_card_status}
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-white/40 text-[13px] text-right hidden md:table-cell">
                    {player.stats.wins} / {player.stats.losses}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <RemoveButton playerId={player.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
