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

  // Group by faculty for display
  const byFaculty = clubs.reduce<Record<string, Club[]>>((acc, club) => {
    (acc[club.faculty] ??= []).push(club);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">Club Directory</h1>
          <p className="text-muted text-sm">{clubs.length} registered club{clubs.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {clubs.length === 0 ? (
        <div className="border border-border bg-white px-8 py-14 text-center">
          <p className="text-navy font-semibold">No clubs registered yet.</p>
          <p className="text-muted text-sm mt-2">Be the first — register your club today.</p>
          <Link
            href="/register"
            className="mt-6 inline-block bg-gold text-navy text-sm font-semibold px-5 py-2 rounded hover:bg-gold/90 transition-colors"
          >
            Register Club
          </Link>
        </div>
      ) : (
        Object.entries(byFaculty).map(([faculty, facultyClubs]) => (
          <section key={faculty} className="mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted border-b border-border pb-2 mb-4">
              {faculty}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {facultyClubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.slug}`}
                  className="block bg-white border border-border p-4 hover:border-cobalt transition-colors group text-center"
                >
                  <div className="w-14 h-14 mx-auto mb-3 bg-surface border border-border flex items-center justify-center overflow-hidden">
                    {club.logo_url ? (
                      <Image
                        src={club.logo_url}
                        alt={`${club.name} logo`}
                        width={56}
                        height={56}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-cobalt/30 select-none">
                        {club.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-navy group-hover:text-cobalt transition-colors leading-tight">
                    {club.name}
                  </p>
                  <p className="text-xs text-muted mt-1">{club.department}</p>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
