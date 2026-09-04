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

  const str = (key: string, fallback?: string) =>
    (formData.get(key) as string | null)?.trim() || fallback || null;

  const payload = {
    id: 1,
    current_season:     str("current_season",    "Season 2026"),
    social_youtube:     str("social_youtube"),
    social_instagram:   str("social_instagram"),
    social_twitter:     str("social_twitter"),
    social_tiktok:      str("social_tiktok"),
    social_discord:     str("social_discord"),
    about_text:         str("about_text"),
    contact_email:      str("contact_email"),
    hero_title:         str("hero_title",        "University Esports, Officially Organized."),
    hero_subtitle:      str("hero_subtitle"),
    hero_bg_image_url:  str("hero_bg_image_url"),
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

export async function updateContentSettings(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const str = (key: string, fallback: string) =>
    (formData.get(key) as string | null)?.trim() || fallback;

  const payload = {
    id: 1,
    site_name:               str("site_name",               "The League"),
    home_cta_eyebrow:        str("home_cta_eyebrow",        "Join The League"),
    home_cta_headline:       str("home_cta_headline",       "Represent Your University"),
    home_cta_description:    str("home_cta_description",    "Register your club, compete for your department and faculty, and represent your university at the championship level."),
    home_cta_primary_btn:    str("home_cta_primary_btn",    "Register Your Club"),
    home_cta_secondary_link: str("home_cta_secondary_link", "Sponsor The League"),
    competitions_description: str("competitions_description", "Multiple competitions run concurrently — from the flagship University Championship to standalone cups."),
    highlights_description:  str("highlights_description",  "Match VODs and moments from the season."),
    standings_description:   str("standings_description",   "Updated after every confirmed result."),
    fixtures_eyebrow:        str("fixtures_eyebrow",        "Schedule & Results"),
    empty_competitions_heading: str("empty_competitions_heading", "Season 1 is getting ready."),
    empty_competitions_text:    str("empty_competitions_text",    "Competitions will appear here once registration opens."),
    empty_live_heading:         str("empty_live_heading",         "No live streams right now."),
    empty_live_text:            str("empty_live_text",            "Check back during scheduled match days."),
    sponsorship_email:        str("sponsorship_email",        "sponsorship@theleague.ng"),
    sponsors_description:     str("sponsors_description",     "The League is the official governing body for university esports. We run structured competitions across departments, faculties, and the university — with a growing audience of students, alumni, and fans."),
    sponsors_cta_description: str("sponsors_cta_description", "We work with sponsors to build custom packages that fit your goals. Reach out and we will put together a proposal."),
    tier_title_name:         str("tier_title_name",         "Title Sponsor"),
    tier_title_description:  str("tier_title_description",  "Full naming rights to the season. Maximum logo placement across all competition materials, streams, and digital surfaces."),
    tier_gold_name:          str("tier_gold_name",          "Gold Partner"),
    tier_gold_description:   str("tier_gold_description",   "Premium placement on fixtures, standings, and the club directory. Named in all official communications."),
    tier_silver_name:        str("tier_silver_name",        "Silver Partner"),
    tier_silver_description: str("tier_silver_description", "Logo placement on the public site and match day materials. Named in season announcements."),
    tier_bronze_name:        str("tier_bronze_name",        "Bronze Partner"),
    tier_bronze_description: str("tier_bronze_description", "Logo on the sponsors page and acknowledgement in season communications."),
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  const { error } = await db.from("site_settings").upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("admin/updateContentSettings:", error);
    return { error: "Could not save content. Run migration 015 first if columns are missing." };
  }

  revalidatePath("/");
  revalidatePath("/competitions");
  revalidatePath("/highlights");
  revalidatePath("/standings");
  revalidatePath("/fixtures");
  revalidatePath("/live");
  revalidatePath("/sponsors");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateTheme(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const newGold   = (formData.get("theme_gold")   as string | null)?.trim() || null;
  const newCobalt = (formData.get("theme_cobalt") as string | null)?.trim() || null;
  const newNavy   = (formData.get("theme_navy")   as string | null)?.trim() || null;

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

export async function toggleRegistration(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const enabled = formData.get("enabled") === "true";

  const { error } = await db.from("site_settings").upsert({
    id: 1,
    registration_enabled: enabled,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }, { onConflict: "id" });

  if (error) {
    console.error("admin/toggleRegistration:", error);
    return { error: "Could not update registration status. Please try again." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/register");
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
