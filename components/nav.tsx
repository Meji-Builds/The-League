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

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-navy/95 backdrop-blur-md border-b border-rim">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-2">
            <div className="w-7 h-7 bg-gold flex items-center justify-center shrink-0">
              <ShieldIcon className="w-3.5 h-3.5 text-navy" />
            </div>
            <div className="leading-none">
              <p className="font-display text-white font-bold text-sm tracking-widest uppercase leading-none">
                The League
              </p>
              <p className="text-white/30 text-[9px] tracking-[0.18em] uppercase mt-0.5 leading-none">
                University Esports
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  active(href)
                    ? "text-gold"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            <Link
              href="/login"
              className="text-sm font-medium text-white/45 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-bold bg-gold text-navy px-4 py-2 rounded hover:brightness-110 transition-all uppercase tracking-wide"
            >
              Register Club
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white/60 hover:text-white p-1 ml-auto"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-rim bg-navy">
          <nav className="flex flex-col px-4 py-2">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`py-3 text-sm font-medium border-b border-rim/60 transition-colors ${
                  active(href) ? "text-gold" : "text-white/55"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-4 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-center border border-rim text-white/55 py-2.5 rounded hover:text-white hover:border-white/25 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-bold bg-gold text-navy py-2.5 rounded text-center hover:brightness-110 transition-all uppercase tracking-wide"
            >
              Register Your Club
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
