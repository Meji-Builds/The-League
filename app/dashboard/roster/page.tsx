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
  stats: { matches_played: number; wins: number; losses: number };
}

export default async function RosterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: owner } = await db
    .from("club_owners")
    .select("club_id, club:clubs(name)")
    .eq("user_id", user.id)
    .single();

  if (!owner?.club_id) redirect("/dashboard/onboarding");

  const { data: rawPlayers } = await db
    .from("players")
    .select("id, gamer_tag, full_name, position, stats")
    .eq("club_id", owner.club_id)
    .order("gamer_tag");

  const players = (rawPlayers ?? []) as Player[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Roster</h1>
        <p className="text-muted text-sm mt-1">
          {owner.club?.name} &middot; {players.length} {players.length === 1 ? "player" : "players"}
        </p>
      </div>

      <div className="mb-8">
        <AddPlayerForm />
      </div>

      {players.length === 0 ? (
        <div className="border border-border bg-white rounded p-8 text-center">
          <p className="text-muted text-sm">No players yet. Add your first player above.</p>
        </div>
      ) : (
        <div className="border border-border bg-white rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">
                  Gamer tag
                </th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3 hidden sm:table-cell">
                  Full name
                </th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3 hidden md:table-cell">
                  Position
                </th>
                <th className="text-right text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3 hidden md:table-cell">
                  W / L
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-navy">{player.gamer_tag}</td>
                  <td className="px-5 py-3 text-muted hidden sm:table-cell">
                    {player.full_name ?? <span className="text-muted/40">—</span>}
                  </td>
                  <td className="px-5 py-3 text-muted hidden md:table-cell">
                    {player.position ?? <span className="text-muted/40">—</span>}
                  </td>
                  <td className="px-5 py-3 text-muted text-right hidden md:table-cell">
                    {player.stats.wins} / {player.stats.losses}
                  </td>
                  <td className="px-5 py-3 text-right">
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
