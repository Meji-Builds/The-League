import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";

interface Faculty {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface Division {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  display_order: number;
}

const PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

function badgeColor(name: string) {
  return PALETTE[name.charCodeAt(0) % PALETTE.length];
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

export default async function FacultyPage({ params }: { params: Promise<{ faculty: string }> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;
  const { faculty: facultySlug } = await params;

  const { data: facultyData } = await db
    .from("faculties")
    .select("id, name, slug, logo_url")
    .eq("slug", facultySlug)
    .single();

  if (!facultyData) notFound();
  const faculty = facultyData as Faculty;

  const [{ data: divisionsData }, siteSettings] = await Promise.all([
    db
      .from("faculty_divisions")
      .select("id, name, slug, logo_url, display_order")
      .eq("faculty_id", faculty.id)
      .order("display_order")
      .order("name"),
    getSiteSettings(),
  ]);

  const divisions = (divisionsData ?? []) as Division[];
  const currentSeason = siteSettings.current_season;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-10 text-[11px] text-white/30">
        <Link href="/leagues" className="hover:text-white/60 transition-colors">Leagues</Link>
        <span>/</span>
        <span className="text-white/50">{faculty.name}</span>
      </div>

      {/* Faculty header */}
      <div className="flex items-center gap-6 mb-14">
        {faculty.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={faculty.logo_url} alt={faculty.name} className="w-16 h-16 object-contain shrink-0" />
        ) : (
          <div
            className="w-16 h-16 flex items-center justify-center shrink-0"
            style={{ backgroundColor: badgeColor(faculty.name) }}
          >
            <span className="font-display font-black text-xl text-navy">{initials(faculty.name)}</span>
          </div>
        )}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-2">{currentSeason}</p>
          <h1 className="font-display font-black text-[2.5rem] text-white uppercase leading-none">{faculty.name}</h1>
          <p className="text-white/35 text-sm mt-1">Select a division to view the standings table.</p>
        </div>
      </div>

      {/* Divisions grid */}
      {divisions.length === 0 ? (
        <div className="border border-white/8 bg-card px-8 py-16 text-center">
          <p className="text-white font-semibold">No divisions set up yet.</p>
          <p className="text-white/35 text-sm mt-2">Divisions will appear here once they are configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-white/5 border border-white/5">
          {divisions.map((d) => (
            <Link
              key={d.id}
              href={`/leagues/${faculty.slug}/${d.slug}`}
              className="bg-card hover:bg-white/[0.04] transition-colors group flex flex-col items-center gap-5 p-8"
            >
              {/* Division logo or badge */}
              <div
                className="w-20 h-20 flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: d.logo_url ? undefined : badgeColor(d.name) }}
              >
                {d.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.logo_url} alt={d.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="font-display font-black text-2xl text-navy">{initials(d.name)}</span>
                )}
              </div>

              <div className="text-center">
                <p className="font-display font-black text-sm text-white/80 group-hover:text-white uppercase tracking-wide transition-colors leading-tight">
                  {d.name}
                </p>
                <p className="text-[10px] text-cobalt mt-1 uppercase tracking-[0.15em]">Division</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
