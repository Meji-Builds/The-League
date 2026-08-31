import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata = { title: "Leagues" };

interface Faculty {
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
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 3).toUpperCase();
}

export default async function LeaguesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const [{ data }, siteSettings] = await Promise.all([
    db.from("faculties").select("id, name, slug, logo_url, display_order").order("display_order").order("name"),
    getSiteSettings(),
  ]);

  const faculties = (data ?? []) as Faculty[];
  const currentSeason = siteSettings.current_season;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">{currentSeason}</p>
        <h1 className="font-display font-black text-[3rem] text-white uppercase leading-none">Leagues</h1>
        <p className="text-white/35 text-sm mt-3">Select a faculty to view its league standings.</p>
      </div>

      {faculties.length === 0 ? (
        <div className="border border-white/8 bg-card px-8 py-16 text-center">
          <p className="text-white font-semibold">No leagues set up yet.</p>
          <p className="text-white/35 text-sm mt-2">Faculty leagues will appear here once the season begins.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-white/5 border border-white/5">
          {faculties.map((f) => (
            <Link
              key={f.id}
              href={`/leagues/${f.slug}`}
              className="bg-card hover:bg-white/[0.04] transition-colors group flex flex-col items-center gap-5 p-8"
            >
              {/* Logo or colored initials badge */}
              <div
                className="w-20 h-20 flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: f.logo_url ? undefined : badgeColor(f.name) }}
              >
                {f.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.logo_url} alt={f.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="font-display font-black text-2xl text-navy">{initials(f.name)}</span>
                )}
              </div>

              <div className="text-center">
                <p className="font-display font-black text-sm text-white/80 group-hover:text-white uppercase tracking-wide transition-colors leading-tight">
                  {f.name}
                </p>
                <p className="text-[10px] text-cobalt mt-1 uppercase tracking-[0.15em]">Faculty</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
