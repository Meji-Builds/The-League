import { createClient } from "@/lib/supabase/server";

export interface SiteSettings {
  // Identity
  site_name:               string;
  current_season:          string;
  // Hero / homepage
  hero_title:              string | null;
  hero_subtitle:           string | null;
  hero_bg_image_url:       string | null;
  about_text:              string | null;
  contact_email:           string | null;
  // Homepage bottom CTA
  home_cta_eyebrow:        string;
  home_cta_headline:       string;
  home_cta_description:    string;
  home_cta_primary_btn:    string;
  home_cta_secondary_link: string;
  // Page descriptions
  competitions_description: string;
  highlights_description:  string;
  standings_description:   string;
  fixtures_eyebrow:        string;
  // Empty states
  empty_competitions_heading: string;
  empty_competitions_text:    string;
  empty_live_heading:         string;
  empty_live_text:            string;
  // Sponsors page
  sponsorship_email:        string;
  sponsors_description:     string;
  sponsors_cta_description: string;
  // Sponsorship tiers
  tier_title_name:         string;
  tier_title_description:  string;
  tier_gold_name:          string;
  tier_gold_description:   string;
  tier_silver_name:        string;
  tier_silver_description: string;
  tier_bronze_name:        string;
  tier_bronze_description: string;
  // Social links
  social_youtube:    string | null;
  social_instagram:  string | null;
  social_twitter:    string | null;
  social_tiktok:     string | null;
  social_discord:    string | null;
  // Theme
  theme_gold:   string | null;
  theme_cobalt: string | null;
  theme_navy:   string | null;
}

export const SITE_DEFAULTS: SiteSettings = {
  site_name:               "The League",
  current_season:          "Season 2026",
  hero_title:              "University Esports, Officially Organized.",
  hero_subtitle:           null,
  hero_bg_image_url:       null,
  about_text:              null,
  contact_email:           null,
  home_cta_eyebrow:        "Join The League",
  home_cta_headline:       "Represent Your University",
  home_cta_description:    "Register your club, compete for your department and faculty, and represent your university at the championship level.",
  home_cta_primary_btn:    "Register Your Club",
  home_cta_secondary_link: "Sponsor The League",
  competitions_description: "Multiple competitions run concurrently — from the flagship University Championship to standalone cups.",
  highlights_description:  "Match VODs and moments from the season.",
  standings_description:   "Updated after every confirmed result.",
  fixtures_eyebrow:        "Schedule & Results",
  empty_competitions_heading: "Season 1 is getting ready.",
  empty_competitions_text:    "Competitions will appear here once registration opens.",
  empty_live_heading:         "No live streams right now.",
  empty_live_text:            "Check back during scheduled match days.",
  sponsorship_email:        "sponsorship@theleague.ng",
  sponsors_description:     "The League is the official governing body for university esports. We run structured competitions across departments, faculties, and the university — with a growing audience of students, alumni, and fans.",
  sponsors_cta_description: "We work with sponsors to build custom packages that fit your goals. Reach out and we will put together a proposal.",
  tier_title_name:         "Title Sponsor",
  tier_title_description:  "Full naming rights to the season. Maximum logo placement across all competition materials, streams, and digital surfaces.",
  tier_gold_name:          "Gold Partner",
  tier_gold_description:   "Premium placement on fixtures, standings, and the club directory. Named in all official communications.",
  tier_silver_name:        "Silver Partner",
  tier_silver_description: "Logo placement on the public site and match day materials. Named in season announcements.",
  tier_bronze_name:        "Bronze Partner",
  tier_bronze_description: "Logo on the sponsors page and acknowledgement in season communications.",
  social_youtube:    null,
  social_instagram:  null,
  social_twitter:    null,
  social_tiktok:     null,
  social_discord:    null,
  theme_gold:   null,
  theme_cobalt: null,
  theme_navy:   null,
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
    if (!data) return SITE_DEFAULTS;
    return { ...SITE_DEFAULTS, ...data };
  } catch {
    return SITE_DEFAULTS;
  }
}
