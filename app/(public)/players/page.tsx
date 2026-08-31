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

const AVATAR_PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];
function avatarColor(name: string) { return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]; }

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-14">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Season 2025</p>
        <div className="flex items-end justify-between">
          <h1 className="font-display font-black text-[3rem] text-white uppercase leading-none">Players</h1>
          <p className="text-white/25 text-sm pb-1">{players.length} player{players.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="border border-white/8 bg-card px-8 py-16 text-center">
          <p className="text-white font-semibold">No players yet.</p>
          <p className="text-white/35 text-sm mt-2">Players are added by their club owners.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-white/5 border border-white/5">
          {players.map((p) => (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="block bg-card p-5 hover:bg-white/[0.03] transition-colors group text-center"
            >
              <div className="w-14 h-14 mx-auto mb-3 overflow-hidden flex items-center justify-center border border-white/6"
                style={{ borderRadius: "50%" }}>
                {p.profile_picture_url ? (
                  <Image
                    src={p.profile_picture_url}
                    alt={p.gamer_tag}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span
                    className="text-xl font-black select-none"
                    style={{ color: avatarColor(p.gamer_tag) }}
                  >
                    {p.gamer_tag.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-semibold text-white group-hover:text-gold transition-colors truncate">
                {p.gamer_tag}
              </p>
              <p className="text-[11px] text-white/25 mt-1 truncate">{p.club?.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
