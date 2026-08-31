import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditFacultyForm } from "./EditFacultyForm";
import { AddDivisionForm } from "./AddDivisionForm";
import { DivisionCard } from "./DivisionCard";

interface Faculty {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  logo_url: string | null;
  display_order: number;
}

interface Division {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  display_order: number;
}

interface Club {
  id: string;
  name: string;
  faculty: string;
}

interface DivisionClubRow {
  division_id: string;
  club: { id: string; name: string; faculty: string } | null;
}

export default async function AdminFacultyDetailPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const { data: facultyData } = await db
    .from("faculties")
    .select("id, name, short_name, slug, logo_url, display_order")
    .eq("id", params.id)
    .single();

  if (!facultyData) notFound();
  const faculty = facultyData as Faculty;

  // Fetch divisions and faculty clubs in parallel
  const [{ data: divisionsData }, { data: allClubsData }] = await Promise.all([
    db
      .from("faculty_divisions")
      .select("id, name, slug, logo_url, display_order")
      .eq("faculty_id", faculty.id)
      .order("display_order")
      .order("name"),
    db
      .from("clubs")
      .select("id, name, faculty")
      .eq("status", "approved")
      .or(`faculty.eq.${faculty.name},faculty.eq.${faculty.short_name}`),
  ]);

  const divisions = (divisionsData ?? []) as Division[];
  const facultyClubs = (allClubsData ?? []) as Club[];

  // Fetch club assignments for all divisions in one query
  const clubsByDivision = new Map<string, Club[]>();
  if (divisions.length > 0) {
    const divisionIds = divisions.map((d) => d.id);
    const { data: dcData } = await db
      .from("division_clubs")
      .select("division_id, club:clubs(id, name, faculty)")
      .in("division_id", divisionIds);

    for (const row of (dcData ?? []) as DivisionClubRow[]) {
      if (!row.club) continue;
      const existing = clubsByDivision.get(row.division_id) ?? [];
      existing.push(row.club as Club);
      clubsByDivision.set(row.division_id, existing);
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-[11px] text-white/30">
        <Link href="/admin/faculties" className="hover:text-white/60 transition-colors">Faculties</Link>
        <span>/</span>
        <span className="text-white/50">{faculty.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-10">
        {faculty.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={faculty.logo_url} alt={faculty.name} className="w-12 h-12 object-contain shrink-0" />
        ) : (
          <div className="w-12 h-12 bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
            <span className="text-xs font-black text-white/30 uppercase">{(faculty.short_name || faculty.name).slice(0, 3)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-1">Admin · Faculties</p>
          <h1 className="font-display font-black text-[1.75rem] text-white uppercase leading-none">{faculty.name}</h1>
          <p className="text-white/40 text-sm mt-1">{faculty.short_name} &middot; /{faculty.slug}</p>
        </div>
        <EditFacultyForm faculty={faculty} />
      </div>

      {/* Divisions */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">
          Divisions ({divisions.length})
        </p>

        {divisions.length > 0 && (
          <div className="space-y-3 mb-6">
            {divisions.map((div) => (
              <DivisionCard
                key={div.id}
                division={div}
                facultyId={faculty.id}
                facultyClubs={facultyClubs}
                assignedClubs={clubsByDivision.get(div.id) ?? []}
              />
            ))}
          </div>
        )}

        <AddDivisionForm facultyId={faculty.id} />
      </div>

      {facultyClubs.length === 0 && (
        <div className="mt-6 border border-white/6 bg-card px-6 py-5">
          <p className="text-white/40 text-xs">
            No approved clubs from <strong className="text-white/60">{faculty.name}</strong> found.
            Clubs enter their faculty when registering — once approved they appear in the division club pickers above.
          </p>
        </div>
      )}
    </div>
  );
}
