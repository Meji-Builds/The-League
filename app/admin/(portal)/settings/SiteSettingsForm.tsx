"use client";

import { useActionState } from "react";
import { updateSiteSettings } from "./actions";
import { ImageUploadField } from "@/app/admin/_components/ImageUploadField";

interface SiteSettings {
  social_youtube:      string | null;
  social_instagram:    string | null;
  social_twitter:      string | null;
  social_tiktok:       string | null;
  social_discord:      string | null;
  about_text:          string | null;
  contact_email:       string | null;
  hero_title:          string | null;
  hero_subtitle:       string | null;
  hero_bg_image_url:   string | null;
}

function Field({ label, name, value, placeholder }: {
  label: string;
  name: string;
  value: string | null;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
        {label}
      </label>
      <input
        name={name}
        type="url"
        defaultValue={value ?? ""}
        placeholder={placeholder}
        className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
      />
    </div>
  );
}

export function SiteSettingsForm({ settings }: { settings: SiteSettings | null }) {
  const [state, action, isPending] = useActionState(updateSiteSettings, null);

  return (
    <form action={action} className="space-y-5">
      {"error" in (state ?? {}) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 rounded">
          {(state as { error: string }).error}
        </div>
      )}
      {"success" in (state ?? {}) && (
        <div className="bg-success/5 border border-success/30 text-success text-xs px-3 py-2 rounded">
          Settings saved.
        </div>
      )}

      <div>
        <p className="text-navy text-xs font-semibold uppercase tracking-wide mb-3">Social links</p>
        <div className="space-y-3">
          <Field label="YouTube"   name="social_youtube"   value={settings?.social_youtube   ?? null} placeholder="https://youtube.com/@..." />
          <Field label="Instagram" name="social_instagram" value={settings?.social_instagram ?? null} placeholder="https://instagram.com/..." />
          <Field label="Twitter / X" name="social_twitter" value={settings?.social_twitter   ?? null} placeholder="https://x.com/..." />
          <Field label="TikTok"    name="social_tiktok"    value={settings?.social_tiktok    ?? null} placeholder="https://tiktok.com/@..." />
          <Field label="Discord"   name="social_discord"   value={settings?.social_discord   ?? null} placeholder="https://discord.gg/..." />
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-navy text-xs font-semibold uppercase tracking-wide mb-3">Platform content</p>
        <div className="space-y-3">
          <div>
            <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
              Hero headline
            </label>
            <input
              name="hero_title"
              type="text"
              defaultValue={settings?.hero_title ?? "University Esports, Officially Organized."}
              className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
            />
          </div>
          <div>
            <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
              Hero subtitle
            </label>
            <input
              name="hero_subtitle"
              type="text"
              defaultValue={settings?.hero_subtitle ?? ""}
              placeholder="Short tagline shown below the headline"
              className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
            />
          </div>
          <ImageUploadField
            name="hero_bg_image_url"
            folder="hero"
            label="Hero background image"
            currentUrl={settings?.hero_bg_image_url}
            aspectHint="16:9 or wider recommended"
          />
          <div>
            <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
              About us
            </label>
            <textarea
              name="about_text"
              rows={4}
              defaultValue={settings?.about_text ?? ""}
              placeholder="Platform description shown on the About/Sponsors page"
              className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
              Contact email
            </label>
            <input
              name="contact_email"
              type="email"
              defaultValue={settings?.contact_email ?? ""}
              placeholder="sponsorship@theleague.ng"
              className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
