import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateFacultyForm } from "./CreateFacultyForm";

export const metadata = { title: "Admin — Faculties" };

interface Faculty {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  logo_url: string | null;
  display_order: number;
}

export default async function AdminFacultiesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const { data } = await db
    .from("faculties")
    .select("id, name, short_name, slug, logo_url, display_order")
    .order("display_order")
    .order("name");

  const faculties = (data ?? []) as Faculty[];

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Faculties</h1>
        <p className="text-white/35 text-sm mt-2">Manage faculty leagues, divisions, and club assignments.</p>
      </div>

      <div className="mb-10">
        <CreateFacultyForm />
      </div>

      {faculties.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No faculties yet. Add one above.</p>
        </div>
      ) : (
        <div className="border border-white/6 divide-y divide-white/5">
          {faculties.map((f) => (
            <div key={f.id} className="flex items-center gap-4 p-4 bg-card">
              {f.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.logo_url} alt={f.name} className="w-10 h-10 object-contain shrink-0" />
              ) : (
                <div className="w-10 h-10 bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white/30 uppercase">{f.short_name.slice(0, 3) || f.name.slice(0, 2)}</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{f.name}</p>
                <p className="text-[11px] text-white/40">{f.short_name} &middot; /{f.slug} &middot; order {f.display_order}</p>
              </div>

              <Link
                href={`/admin/faculties/${f.id}`}
                className="text-xs font-semibold px-3 py-1 rounded border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors shrink-0"
              >
                Manage
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
