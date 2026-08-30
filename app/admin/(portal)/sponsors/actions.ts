"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/admin/login");
  return { supabase };
}

type ActionState = { error: string } | { success: true } | null;

export async function createSponsor(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const name          = (formData.get("name")          as string).trim();
  const logo_url      = (formData.get("logo_url")      as string).trim();
  const tier          = (formData.get("tier")          as string).trim();
  const website_url   = (formData.get("website_url")   as string).trim() || null;
  const display_order = parseInt(formData.get("display_order") as string) || 0;

  if (!name)    return { error: "Name is required." };
  if (!tier)    return { error: "Tier is required." };
  if (!logo_url) return { error: "Logo image is required." };

  const { error } = await db.from("global_sponsors").insert({
    name,
    logo_url,
    tier,
    website_url,
    display_order,
  });

  if (error) {
    console.error("admin/createSponsor:", error);
    return { error: "Could not save sponsor. Please try again." };
  }

  revalidatePath("/sponsors");
  revalidatePath("/");
  revalidatePath("/admin/sponsors");
  return { success: true };
}

export async function deleteSponsor(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("global_sponsors").delete().eq("id", id);
  revalidatePath("/sponsors");
  revalidatePath("/");
  revalidatePath("/admin/sponsors");
}
