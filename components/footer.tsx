import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface SiteSettings {
  social_youtube:   string | null;
  social_instagram: string | null;
  social_twitter:   string | null;
  social_tiktok:    string | null;
  social_discord:   string | null;
}

async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("social_youtube, social_instagram, social_twitter, social_tiktok, social_discord")
      .eq("id", 1)
      .single();
    return data ?? null;
  } catch {
    return null;
  }
}

function YouTubeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.9-2-.9C16.6 5 12 5 12 5s-4.6 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.8C6.4 19 12 19 12 19s4.6 0 7-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM10 15V9l5.2 3-5.2 3z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.26 8.26 0 0 0 4.83 1.54V6.78a4.85 4.85 0 0 1-1.06-.09z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.011.043.03.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export async function Footer() {
  const settings = await getSiteSettings();

  const socials: { href: string; label: string; icon: React.ReactNode }[] = [
    settings?.social_youtube   ? { href: settings.social_youtube,   label: "YouTube",   icon: <YouTubeIcon /> }   : null,
    settings?.social_instagram ? { href: settings.social_instagram, label: "Instagram", icon: <InstagramIcon /> } : null,
    settings?.social_twitter   ? { href: settings.social_twitter,   label: "Twitter",   icon: <TwitterIcon /> }   : null,
    settings?.social_tiktok    ? { href: settings.social_tiktok,    label: "TikTok",    icon: <TikTokIcon /> }    : null,
    settings?.social_discord   ? { href: settings.social_discord,   label: "Discord",   icon: <DiscordIcon /> }   : null,
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

  return (
    <footer className="bg-navy border-t border-rim mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-gold font-bold tracking-widest uppercase text-sm">
              The League
            </span>
            <p className="mt-3 text-white/50 text-xs leading-relaxed">
              University esports — officially organized, seriously competitive.
            </p>
            {socials.length > 0 && (
              <div className="flex items-center gap-3 mt-4">
                {socials.map(({ href, label, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-white/40 hover:text-gold transition-colors"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Competition</p>
            <ul className="space-y-2">
              {[
                ["Competitions", "/competitions"],
                ["Fixtures",     "/fixtures"],
                ["Standings",    "/standings"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-white/60 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Community</p>
            <ul className="space-y-2">
              {[
                ["Clubs",       "/clubs"],
                ["Players",     "/players"],
                ["News",        "/news"],
                ["Highlights",  "/highlights"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-white/60 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Organisation</p>
            <ul className="space-y-2">
              {[
                ["Sponsors",       "/sponsors"],
                ["Register Club",  "/register"],
                ["Club Login",     "/login"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-white/60 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-rim mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} The League. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">Season 1</p>
        </div>
      </div>
    </footer>
  );
}
