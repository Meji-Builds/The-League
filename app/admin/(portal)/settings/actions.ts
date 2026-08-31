"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/admin/login");
  return { supabase, user };
}

type ActionState = { error: string } | { success: true } | null;

export async function updateFeeSettings(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();

  const registrationFee = parseFloat(formData.get("owner_registration_fee") as string);
  if (isNaN(registrationFee) || registrationFee < 0) {
    return { error: "Enter a valid fee amount (0 or higher)." };
  }

  const maxPlayers = parseInt(formData.get("max_players_per_club") as string, 10);
  if (isNaN(maxPlayers) || maxPlayers < 1) {
    return { error: "Max players must be at least 1." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db.from("fee_settings").upsert({
    id: 1,
    owner_registration_fee: registrationFee,
    max_players_per_club: maxPlayers,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }, { onConflict: "id" });

  if (error) {
    console.error("admin/updateFeeSettings:", error);
    return { error: "Could not save settings. Please try again." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateSiteSettings(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const payload = {
    id: 1,
    social_youtube:     (formData.get("social_youtube")     as string).trim() || null,
    social_instagram:   (formData.get("social_instagram")   as string).trim() || null,
    social_twitter:     (formData.get("social_twitter")     as string).trim() || null,
    social_tiktok:      (formData.get("social_tiktok")      as string).trim() || null,
    social_discord:     (formData.get("social_discord")     as string).trim() || null,
    about_text:         (formData.get("about_text")         as string).trim() || null,
    contact_email:      (formData.get("contact_email")      as string).trim() || null,
    hero_title:         (formData.get("hero_title")         as string).trim() || "University Esports, Officially Organized.",
    hero_subtitle:      (formData.get("hero_subtitle")      as string).trim() || null,
    hero_bg_image_url:  (formData.get("hero_bg_image_url")  as string).trim() || null,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  let { error } = await db.from("site_settings").upsert(payload, { onConflict: "id" });

  // hero_bg_image_url column may not exist yet — retry without it
  if (error?.message?.includes("hero_bg_image_url")) {
    const { hero_bg_image_url: _omit, ...payloadWithout } = payload;
    ({ error } = await db.from("site_settings").upsert(payloadWithout, { onConflict: "id" }));
  }

  if (error) {
    console.error("admin/updateSiteSettings:", error);
    return { error: "Could not save settings. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateTheme(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const newGold   = (formData.get("theme_gold")   as string).trim() || null;
  const newCobalt = (formData.get("theme_cobalt") as string).trim() || null;
  const newNavy   = (formData.get("theme_navy")   as string).trim() || null;

  // Read current theme to push to history
  const { data: current } = await db.from("site_settings").select("theme_gold, theme_cobalt, theme_navy, theme_history").eq("id", 1).single();
  const history: Array<{gold: string|null; cobalt: string|null; navy: string|null; saved_at: string}> = current?.theme_history ?? [];

  // Push current theme to history (keep last 5)
  const snapshot = { gold: current?.theme_gold ?? null, cobalt: current?.theme_cobalt ?? null, navy: current?.theme_navy ?? null, saved_at: new Date().toISOString() };
  const updatedHistory = [snapshot, ...history].slice(0, 5);

  const { error } = await db.from("site_settings").upsert({
    id: 1,
    theme_gold:    newGold,
    theme_cobalt:  newCobalt,
    theme_navy:    newNavy,
    theme_history: updatedHistory,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });

  if (error) {
    console.error("admin/updateTheme:", error);
    if (error.message?.includes("theme_")) {
      return { error: "Theme columns not yet in DB. Run the SQL migration first." };
    }
    return { error: "Could not save theme. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function revertTheme(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const index = parseInt(formData.get("index") as string, 10);
  const { data: current } = await db.from("site_settings").select("theme_history").eq("id", 1).single();
  const history: Array<{gold: string|null; cobalt: string|null; navy: string|null}> = current?.theme_history ?? [];

  const target = history[index];
  if (!target) return { error: "Theme snapshot not found." };

  const newHistory = history.filter((_, i) => i !== index);

  const { error } = await db.from("site_settings").upsert({
    id: 1,
    theme_gold:    target.gold,
    theme_cobalt:  target.cobalt,
    theme_navy:    target.navy,
    theme_history: newHistory,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });

  if (error) {
    console.error("admin/revertTheme:", error);
    return { error: "Could not revert theme." };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { success: true };
}
