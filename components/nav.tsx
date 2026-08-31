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
  { label: "Highlights",   href: "/highlights" },
  { label: "News",         href: "/news" },
];

export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
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
              The League
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center flex-1">
            {links.map(({ label, href }) => (
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
              className="text-[11px] font-black uppercase tracking-[0.12em] bg-gold text-navy px-4 py-2 hover:brightness-105 transition-all"
            >
              Register
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white/40 hover:text-white p-1.5 ml-auto transition-colors"
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
        <div className="md:hidden border-t border-white/6 bg-navy/95 backdrop-blur-xl">
          <nav className="flex flex-col px-4 py-2">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`py-3.5 text-sm border-b border-white/5 last:border-0 transition-colors flex items-center justify-between ${
                  active(href) ? "text-white font-medium" : "text-white/40"
                }`}
              >
                {label}
                {active(href) && <span className="w-1.5 h-1.5 bg-gold rounded-full" />}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-4 flex gap-2 border-t border-white/5">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-sm text-center border border-white/10 text-white/40 py-2.5 hover:text-white hover:border-white/20 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-[11px] font-black uppercase tracking-[0.12em] text-center bg-gold text-navy py-2.5 hover:brightness-105 transition-all"
            >
              Register Club
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
