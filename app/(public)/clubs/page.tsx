import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";
import type { Club } from "@/types/database";

export const metadata = { title: "Club Directory" };

async function getClubs(): Promise<Club[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clubs")
      .select("*")
      .eq("status", "approved")
      .order("name");
    return data ?? [];
  } catch {
    return [];
  }
}

const AVATAR_PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];
function avatarColor(name: string) { return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]; }

export default async function ClubsPage() {
  const [clubs, siteSettings] = await Promise.all([getClubs(), getSiteSettings()]);
  const currentSeason = siteSettings.current_season;

  const byFaculty = clubs.reduce<Record<string, Club[]>>((acc, club) => {
    (acc[club.faculty] ??= []).push(club);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-14">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">{currentSeason}</p>
        <div className="flex items-end justify-between">
          <h1 className="font-display font-black text-[3rem] text-white uppercase leading-none">Club Directory</h1>
          <p className="text-white/25 text-sm pb-1">{clubs.length} club{clubs.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {clubs.length === 0 ? (
        <div className="border border-white/8 bg-card px-8 py-16 text-center">
          <p className="text-white font-semibold">No clubs registered yet.</p>
          <p className="text-white/35 text-sm mt-2">Be the first — register your club today.</p>
          <Link
            href="/register"
            className="mt-6 inline-block text-[11px] font-black uppercase tracking-[0.15em] bg-gold text-navy px-6 py-3 rounded hover:brightness-105 transition-all"
          >
            Register Club
          </Link>
        </div>
      ) : (
        Object.entries(byFaculty).map(([faculty, facultyClubs]) => (
          <section key={faculty} className="mb-12">
            <div className="flex items-center gap-4 mb-5">
              <p className="text-[9px] font-bold text-white/35 uppercase tracking-[0.4em] whitespace-nowrap">{faculty}</p>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-white/5 border border-white/5">
              {facultyClubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.slug}`}
                  className="block bg-card p-5 hover:bg-white/[0.03] transition-colors group text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center overflow-hidden">
                    {club.logo_url && club.logo_status === "approved" ? (
                      <Image
                        src={club.logo_url}
                        alt={`${club.name} logo`}
                        width={64}
                        height={64}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 flex items-center justify-center text-navy text-2xl font-black select-none"
                        style={{ backgroundColor: avatarColor(club.name) }}
                      >
                        {club.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-[13px] font-semibold text-white group-hover:text-gold transition-colors leading-tight">
                    {club.name}
                  </p>
                  <p className="text-[11px] text-white/25 mt-1 truncate">{club.department}</p>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
