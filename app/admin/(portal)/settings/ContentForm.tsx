"use client";

import { useActionState } from "react";
import { updateContentSettings } from "./actions";
import type { SiteSettings } from "@/lib/site-settings";

function Field({
  label, name, value, placeholder, hint, textarea = false, rows = 2,
}: {
  label: string; name: string; value: string; placeholder?: string; hint?: string;
  textarea?: boolean; rows?: number;
}) {
  const cls = "w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20";
  return (
    <div>
      <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">{label}</label>
      {textarea ? (
        <textarea name={name} rows={rows} defaultValue={value} placeholder={placeholder}
          className={`${cls} resize-none`} />
      ) : (
        <input name={name} type="text" defaultValue={value} placeholder={placeholder} className={cls} />
      )}
      {hint && <p className="text-white/30 text-[11px] mt-1">{hint}</p>}
    </div>
  );
}

export function ContentForm({ settings }: { settings: SiteSettings | null }) {
  const [state, action, isPending] = useActionState(updateContentSettings, null);

  const v = (key: keyof SiteSettings, fallback: string) =>
    (settings?.[key] as string | null | undefined) ?? fallback;

  return (
    <form action={action} className="space-y-6">
      {"error" in (state ?? {}) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2">
          {(state as { error: string }).error}
        </div>
      )}
      {"success" in (state ?? {}) && (
        <div className="bg-success/5 border border-success/30 text-success text-xs px-3 py-2">
          Content saved.
        </div>
      )}

      {/* Site identity */}
      <div>
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">Site identity</p>
        <Field label="Site name" name="site_name" value={v("site_name", "The League")}
          hint="Shown in the nav logo and hero eyebrow." />
      </div>

      {/* Homepage CTA */}
      <div className="border-t border-white/6 pt-5">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">Homepage — bottom CTA</p>
        <div className="space-y-3">
          <Field label="Eyebrow label" name="home_cta_eyebrow"
            value={v("home_cta_eyebrow", "Join The League")} />
          <Field label="Headline" name="home_cta_headline"
            value={v("home_cta_headline", "Represent Your University")} />
          <Field label="Description" name="home_cta_description"
            value={v("home_cta_description", "Register your club, compete for your department and faculty, and represent your university at the championship level.")}
            textarea rows={2} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Primary button" name="home_cta_primary_btn"
              value={v("home_cta_primary_btn", "Register Your Club")} />
            <Field label="Secondary link" name="home_cta_secondary_link"
              value={v("home_cta_secondary_link", "Sponsor The League")} />
          </div>
        </div>
      </div>

      {/* Page descriptions */}
      <div className="border-t border-white/6 pt-5">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">Page descriptions</p>
        <div className="space-y-3">
          <Field label="Competitions page description" name="competitions_description"
            value={v("competitions_description", "Multiple competitions run concurrently — from the flagship University Championship to standalone cups.")}
            textarea rows={2} />
          <Field label="Highlights page description" name="highlights_description"
            value={v("highlights_description", "Match VODs and moments from the season.")} />
          <Field label="Standings page description" name="standings_description"
            value={v("standings_description", "Updated after every confirmed result.")} />
          <Field label="Fixtures page eyebrow" name="fixtures_eyebrow"
            value={v("fixtures_eyebrow", "Schedule & Results")} />
        </div>
      </div>

      {/* Empty states */}
      <div className="border-t border-white/6 pt-5">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">Empty-state messages</p>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="No competitions — heading" name="empty_competitions_heading"
              value={v("empty_competitions_heading", "Season 1 is getting ready.")} />
            <Field label="No competitions — sub-text" name="empty_competitions_text"
              value={v("empty_competitions_text", "Competitions will appear here once registration opens.")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="No live streams — heading" name="empty_live_heading"
              value={v("empty_live_heading", "No live streams right now.")} />
            <Field label="No live streams — sub-text" name="empty_live_text"
              value={v("empty_live_text", "Check back during scheduled match days.")} />
          </div>
        </div>
      </div>

      {/* Sponsors page */}
      <div className="border-t border-white/6 pt-5">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">Sponsors page</p>
        <div className="space-y-3">
          <Field label="Sponsorship email" name="sponsorship_email"
            value={v("sponsorship_email", "sponsorship@theleague.ng")} />
          <Field label="Header description" name="sponsors_description"
            value={v("sponsors_description", "The League is the official governing body for university esports. We run structured competitions across departments, faculties, and the university — with a growing audience of students, alumni, and fans.")}
            textarea rows={3} />
          <Field label="Bottom CTA description" name="sponsors_cta_description"
            value={v("sponsors_cta_description", "We work with sponsors to build custom packages that fit your goals. Reach out and we will put together a proposal.")}
            textarea rows={2} />
        </div>
      </div>

      {/* Sponsorship tiers */}
      <div className="border-t border-white/6 pt-5">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">Sponsorship tiers</p>
        <div className="space-y-4">
          {(["title", "gold", "silver", "bronze"] as const).map((tier) => (
            <div key={tier} className="border border-white/6 p-3 space-y-2">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">{tier}</p>
              <Field
                label="Tier name"
                name={`tier_${tier}_name`}
                value={v(`tier_${tier}_name` as keyof SiteSettings,
                  tier === "title" ? "Title Sponsor" : tier === "gold" ? "Gold Partner" : tier === "silver" ? "Silver Partner" : "Bronze Partner")}
              />
              <Field
                label="Description"
                name={`tier_${tier}_description`}
                value={v(`tier_${tier}_description` as keyof SiteSettings, "")}
                textarea rows={2}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save content"}
      </button>
    </form>
  );
}
