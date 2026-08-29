"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
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

  return (
    <header className="bg-navy border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-gold font-bold text-lg tracking-widest uppercase">
              The League
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? "text-gold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-gold text-navy px-4 py-2 hover:bg-gold/90 transition-colors"
            >
              Register Club
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-white/70 hover:text-white p-1"
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
        <div className="md:hidden border-t border-white/10 bg-navy">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? "text-gold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-3 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-white/70 hover:text-white py-2 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium bg-gold text-navy px-4 py-2 text-center transition-colors hover:bg-gold/90"
              >
                Register Club
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
