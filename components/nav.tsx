"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const desktopLinks = [
  { label: "Live",           href: "/live" },
  { label: "Leagues",        href: "/leagues" },
  { label: "Championship",   href: "/championship" },
  { label: "Competitions",   href: "/competitions" },
  { label: "Fixtures",       href: "/fixtures" },
  { label: "Standings",      href: "/standings" },
  { label: "Clubs",          href: "/clubs" },
  { label: "Players",        href: "/players" },
  { label: "Highlights",     href: "/highlights" },
  { label: "News",           href: "/news" },
];

// Primary 4 tabs always visible
const primaryTabs = [
  {
    label: "Home",
    href: "/",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "League",
    href: "/leagues",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
      </svg>
    ),
  },
  {
    label: "Matches",
    href: "/fixtures",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "News",
    href: "/news",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <line x1="18" y1="14" x2="10" y2="14" />
        <line x1="15" y1="18" x2="10" y2="18" />
        <rect x="10" y="6" width="8" height="4" />
      </svg>
    ),
  },
];

// Links shown in the "More" sheet
const moreLinks = [
  {
    label: "Championship",
    href: "/championship",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
      </svg>
    ),
  },
  {
    label: "Clubs",
    href: "/clubs",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Players",
    href: "/players",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M3 21v-2a7 7 0 0 1 14 0v2" />
      </svg>
    ),
  },
  {
    label: "Standings",
    href: "/standings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Live",
    href: "/live",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
      </svg>
    ),
  },
  {
    label: "Highlights",
    href: "/highlights",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    ),
  },
  {
    label: "Sponsors",
    href: "/sponsors",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
];

export function Nav({ siteName = "The League" }: { siteName?: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const moreIsActive = moreLinks.some((l) => active(l.href));

  return (
    <>
      {/* ── Top header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-navy/90 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-6">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-2">
              <div
                className="w-5 h-5 bg-gold shrink-0"
                style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
              />
              <span className="font-display font-black text-white text-sm tracking-[0.18em] uppercase">
                {siteName}
              </span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center flex-1">
              {desktopLinks.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-3.5 py-4 text-[13px] transition-colors ${
                    active(href)
                      ? "text-white"
                      : "text-white/35 hover:text-white/75"
                  }`}
                >
                  {label}
                  {active(href) && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-gold" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-1 ml-auto">
              <Link
                href="/login"
                className="text-[13px] text-white/30 hover:text-white/65 transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-[11px] font-black uppercase tracking-[0.12em] bg-gold text-navy px-4 py-2 rounded hover:brightness-105 transition-all"
              >
                Register
              </Link>
            </div>

            {/* Mobile: auth buttons only — bottom nav handles main navigation */}
            <div className="md:hidden ml-auto flex items-center gap-2">
              <Link
                href="/login"
                className="text-[12px] text-white/35 hover:text-white/70 transition-colors px-2 py-1.5"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-[10px] font-black uppercase tracking-[0.1em] bg-gold text-navy px-3 py-1.5 rounded hover:brightness-105 transition-all"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom navigation ──────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy border-t border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex h-16">
          {primaryTabs.map(({ label, href, icon }) => {
            const isActive = active(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors ${
                  isActive ? "text-gold" : "text-white/30 active:text-white/60"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gold" />
                )}
                {icon}
                <span className="text-[9px] font-bold uppercase tracking-[0.07em]">
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={`relative flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors ${
              moreOpen || moreIsActive ? "text-gold" : "text-white/30 active:text-white/60"
            }`}
          >
            {(moreOpen || moreIsActive) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gold" />
            )}
            {moreOpen ? (
              /* X icon when open */
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              /* Grid/dots icon */
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            )}
            <span className="text-[9px] font-bold uppercase tracking-[0.07em]">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* ── "More" slide-up sheet ─────────────────────────────────────── */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMoreOpen(false)}
          />
          {/* Sheet */}
          <div
            className="md:hidden fixed left-0 right-0 z-40 bg-navy border-t border-white/10 rounded-t-2xl"
            style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-4" />
            <div className="px-4 pb-6 grid grid-cols-3 gap-3">
              {moreLinks.map(({ label, href, icon }) => {
                const isActive = active(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-colors ${
                      isActive
                        ? "border-gold/30 bg-gold/5 text-gold"
                        : "border-white/6 bg-white/3 text-white/50 hover:text-white hover:border-white/15"
                    }`}
                  >
                    {icon}
                    <span className="text-[10px] font-bold uppercase tracking-[0.07em]">
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
