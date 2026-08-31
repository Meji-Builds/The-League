import { createClient } from "@/lib/supabase/server";

export interface SiteSettings {
  current_season:    string;
  hero_title:        string | null;
  hero_subtitle:     string | null;
  hero_bg_image_url: string | null;
  about_text:        string | null;
  contact_email:     string | null;
  social_youtube:    string | null;
  social_instagram:  string | null;
  social_twitter:    string | null;
  social_tiktok:     string | null;
  social_discord:    string | null;
  theme_gold:        string | null;
  theme_cobalt:      string | null;
  theme_navy:        string | null;
}

const DEFAULTS: SiteSettings = {
  current_season:    "Season 2026",
  hero_title:        "University Esports, Officially Organized.",
  hero_subtitle:     null,
  hero_bg_image_url: null,
  about_text:        null,
  contact_email:     null,
  social_youtube:    null,
  social_instagram:  null,
  social_twitter:    null,
  social_tiktok:     null,
  social_discord:    null,
  theme_gold:        null,
  theme_cobalt:      null,
  theme_navy:        null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (!data) return DEFAULTS;
    return { ...DEFAULTS, ...data };
  } catch {
    return DEFAULTS;
  }
}
