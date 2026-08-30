import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Player Directory" };

interface PlayerWithClub {
  id:                  string;
  gamer_tag:           string;
  profile_picture_url: string | null;
  club:                { id: string; name: string; slug: string } | null;
}

async function getPlayers(): Promise<PlayerWithClub[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("players")
      .select("id, gamer_tag, profile_picture_url, club:clubs!players_club_id_fkey(id, name, slug)")
      .order("gamer_tag");
    return (data ?? []) as unknown as PlayerWithClub[];
  } catch {
    return [];
  }
}

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-5 h-0.5 bg-gold shrink-0" />
          <p className="text-gold text-xs font-bold uppercase tracking-[0.25em]">Roster</p>
        </div>
        <div className="flex items-end justify-between">
          <h1 className="font-display text-4xl font-bold text-white uppercase tracking-tight">
            Player Directory
          </h1>
          <p className="text-dim text-sm">{players.length} player{players.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="border border-rim bg-card px-8 py-14 text-center rounded">
          <p className="text-white font-semibold">No players yet.</p>
          <p className="text-dim text-sm mt-2">Players are added by their club owners.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {players.map((p) => (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="block bg-card border border-rim p-4 hover:border-cobalt/50 transition-all group text-center rounded"
            >
              <div className="w-14 h-14 mx-auto mb-3 bg-panel border border-rim rounded-full overflow-hidden flex items-center justify-center">
                {p.profile_picture_url ? (
                  <Image
                    src={p.profile_picture_url}
                    alt={p.gamer_tag}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-xl font-bold text-cobalt/50 select-none">
                    {p.gamer_tag.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-gold transition-colors truncate">
                {p.gamer_tag}
              </p>
              <p className="text-xs text-dim mt-1 truncate">{p.club?.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
