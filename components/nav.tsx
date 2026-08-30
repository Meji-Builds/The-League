"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { label: "Live",         href: "/live" },
  { label: "Competitions", href: "/competitions" },
  { label: "Fixtures",     href: "/fixtures" },
  { label: "Standings",    href: "/standings" },
  { label: "Clubs",        href: "/clubs" },
  { label: "Players",      href: "/players" },
  { label: "News",         href: "/news" },
];

export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-navy/95 backdrop-blur-md border-b border-rim">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12 gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 mr-4">
            <div className="w-5 h-5 bg-gold flex items-center justify-center shrink-0" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
            </div>
            <span className="font-display font-bold text-white text-sm tracking-widest uppercase">
              The League
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0 flex-1">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-3 text-[13px] transition-colors relative ${
                  active(href)
                    ? "text-gold font-medium"
                    : "text-white/45 hover:text-white/80"
                }`}
              >
                {label}
                {active(href) && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-gold" />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <Link
              href="/login"
              className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-[13px] font-medium text-white border border-rim px-3 py-1.5 hover:border-white/25 hover:text-white transition-colors"
            >
              Register Club
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white/50 hover:text-white p-1 ml-auto"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-rim bg-navy">
          <nav className="flex flex-col px-4 py-1">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`py-3 text-sm border-b border-rim/40 last:border-0 transition-colors ${
                  active(href) ? "text-gold font-medium" : "text-white/50"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-3 flex gap-2">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-sm text-center border border-rim text-white/50 py-2 hover:text-white hover:border-white/20 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-sm text-center bg-gold text-navy font-semibold py-2 hover:brightness-110 transition-all"
            >
              Register Club
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
