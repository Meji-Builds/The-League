import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
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

export default async function ClubsPage() {
  const clubs = await getClubs();

  const byFaculty = clubs.reduce<Record<string, Club[]>>((acc, club) => {
    (acc[club.faculty] ??= []).push(club);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-end justify-between">
          <h1 className="font-display text-4xl font-bold text-white uppercase tracking-tight">
            Club Directory
          </h1>
          <p className="text-dim text-sm">{clubs.length} club{clubs.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {clubs.length === 0 ? (
        <div className="border border-rim bg-card px-8 py-14 text-center rounded">
          <p className="text-white font-semibold">No clubs registered yet.</p>
          <p className="text-dim text-sm mt-2">Be the first — register your club today.</p>
          <Link
            href="/register"
            className="mt-6 inline-block bg-gold text-navy text-sm font-bold px-5 py-2.5 rounded hover:brightness-110 transition-all uppercase tracking-wide"
          >
            Register Club
          </Link>
        </div>
      ) : (
        Object.entries(byFaculty).map(([faculty, facultyClubs]) => (
          <section key={faculty} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs font-semibold text-gold uppercase tracking-wider whitespace-nowrap">{faculty}</p>
              <div className="flex-1 h-px bg-rim" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {facultyClubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.slug}`}
                  className="block bg-card border border-rim p-4 hover:border-cobalt/50 transition-all group text-center rounded"
                >
                  <div className="w-14 h-14 mx-auto mb-3 bg-panel border border-rim flex items-center justify-center overflow-hidden rounded">
                    {club.logo_url && club.logo_status === "approved" ? (
                      <Image
                        src={club.logo_url}
                        alt={`${club.name} logo`}
                        width={56}
                        height={56}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-cobalt/40 select-none">
                        {club.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white group-hover:text-gold transition-colors leading-tight">
                    {club.name}
                  </p>
                  <p className="text-xs text-dim mt-1">{club.department}</p>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
