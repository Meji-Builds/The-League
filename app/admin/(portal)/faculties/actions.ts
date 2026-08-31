"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdminDb() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/admin/login");
  return supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

type ActionState = { error: string } | null;

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Faculties ──────────────────────────────────────────────────────────────

export async function createFaculty(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();

  const name         = (formData.get("name") as string)?.trim();
  const short_name   = (formData.get("short_name") as string)?.trim();
  const slug         = (formData.get("slug") as string)?.trim() || toSlug(short_name || name || "");
  const logo_url     = (formData.get("logo_url") as string)?.trim() || null;
  const display_order = parseInt(formData.get("display_order") as string) || 0;

  if (!name || !short_name) return { error: "Full name and short name are required." };

  const { error } = await db.from("faculties").insert({ name, short_name, slug, logo_url, display_order });
  if (error) {
    if (error.code === "23505") return { error: "A faculty with that name or slug already exists." };
    return { error: "Could not create faculty. Please try again." };
  }

  revalidatePath("/admin/faculties");
  revalidatePath("/leagues");
  return null;
}

export async function updateFaculty(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();

  const facultyId    = formData.get("faculty_id") as string;
  const name         = (formData.get("name") as string)?.trim();
  const short_name   = (formData.get("short_name") as string)?.trim();
  const slug         = (formData.get("slug") as string)?.trim() || toSlug(short_name || name || "");
  const logo_url     = (formData.get("logo_url") as string)?.trim() || null;
  const display_order = parseInt(formData.get("display_order") as string) || 0;

  if (!facultyId) return { error: "Invalid faculty." };
  if (!name || !short_name) return { error: "Full name and short name are required." };

  const { error } = await db.from("faculties")
    .update({ name, short_name, slug, logo_url, display_order })
    .eq("id", facultyId);

  if (error) {
    if (error.code === "23505") return { error: "A faculty with that name or slug already exists." };
    return { error: "Could not update faculty. Please try again." };
  }

  revalidatePath("/admin/faculties");
  revalidatePath(`/admin/faculties/${facultyId}`);
  revalidatePath("/leagues");
  return null;
}

export async function deleteFaculty(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();
  const facultyId = formData.get("faculty_id") as string;
  if (!facultyId) return { error: "Invalid faculty." };

  const { error } = await db.from("faculties").delete().eq("id", facultyId);
  if (error) return { error: "Could not delete faculty. Please try again." };

  revalidatePath("/admin/faculties");
  revalidatePath("/leagues");
  redirect("/admin/faculties");
}

// ── Divisions ──────────────────────────────────────────────────────────────

export async function createDivision(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();

  const faculty_id    = formData.get("faculty_id") as string;
  const name          = (formData.get("name") as string)?.trim();
  const slug          = (formData.get("slug") as string)?.trim() || toSlug(name || "");
  const logo_url      = (formData.get("logo_url") as string)?.trim() || null;
  const display_order = parseInt(formData.get("display_order") as string) || 0;

  if (!faculty_id) return { error: "Invalid faculty." };
  if (!name) return { error: "Division name is required." };

  const { error } = await db.from("faculty_divisions").insert({ faculty_id, name, slug, logo_url, display_order });
  if (error) {
    if (error.code === "23505") return { error: "A division with that slug already exists in this faculty." };
    return { error: "Could not create division. Please try again." };
  }

  revalidatePath(`/admin/faculties/${faculty_id}`);
  revalidatePath("/leagues");
  return null;
}

export async function updateDivision(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();

  const divisionId    = formData.get("division_id") as string;
  const facultyId     = formData.get("faculty_id") as string;
  const name          = (formData.get("name") as string)?.trim();
  const slug          = (formData.get("slug") as string)?.trim() || toSlug(name || "");
  const logo_url      = (formData.get("logo_url") as string)?.trim() || null;
  const display_order = parseInt(formData.get("display_order") as string) || 0;

  if (!divisionId) return { error: "Invalid division." };
  if (!name) return { error: "Division name is required." };

  const { error } = await db.from("faculty_divisions")
    .update({ name, slug, logo_url, display_order })
    .eq("id", divisionId);

  if (error) {
    if (error.code === "23505") return { error: "A division with that slug already exists in this faculty." };
    return { error: "Could not update division. Please try again." };
  }

  revalidatePath(`/admin/faculties/${facultyId}`);
  revalidatePath("/leagues");
  return null;
}

export async function deleteDivision(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await requireAdminDb();

  const divisionId = formData.get("division_id") as string;
  const facultyId  = formData.get("faculty_id") as string;
  if (!divisionId) return { error: "Invalid division." };

  const { error } = await db.from("faculty_divisions").delete().eq("id", divisionId);
  if (error) return { error: "Could not delete division. Please try again." };

  revalidatePath(`/admin/faculties/${facultyId}`);
  revalidatePath("/leagues");
  return null;
}

// ── Club–Division assignments ──────────────────────────────────────────────

export async function addClubToDivision(formData: FormData) {
  const db = await requireAdminDb();

  const division_id = formData.get("division_id") as string;
  const club_id     = formData.get("club_id") as string;
  const faculty_id  = formData.get("faculty_id") as string;

  if (!division_id || !club_id) return;

  await db.from("division_clubs").upsert({ division_id, club_id }, { onConflict: "division_id,club_id" });

  revalidatePath(`/admin/faculties/${faculty_id}`);
}

export async function removeClubFromDivision(formData: FormData) {
  const db = await requireAdminDb();

  const division_id = formData.get("division_id") as string;
  const club_id     = formData.get("club_id") as string;
  const faculty_id  = formData.get("faculty_id") as string;

  if (!division_id || !club_id) return;

  await db.from("division_clubs").delete().eq("division_id", division_id).eq("club_id", club_id);

  revalidatePath(`/admin/faculties/${faculty_id}`);
}
