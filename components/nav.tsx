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

  return (
    <header className="bg-navy border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-gold rounded flex items-center justify-center flex-shrink-0">
              <ShieldIcon className="w-4 h-4 text-navy" />
            </div>
            <div className="leading-none">
              <p className="text-white font-bold text-sm tracking-widest uppercase leading-none">
                The League
              </p>
              <p className="text-white/40 text-[9px] tracking-[0.18em] uppercase mt-0.5 leading-none">
                University Esports
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(href) ? "text-gold" : "text-white/70 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-gold text-navy px-4 py-2 rounded hover:bg-gold/90 transition-colors"
            >
              Register Club
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white/60 hover:text-white p-1"
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
          <nav className="flex flex-col px-4 py-3 gap-0.5">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`py-3 text-sm font-medium border-b border-white/5 transition-colors ${
                  pathname.startsWith(href) ? "text-gold" : "text-white/70"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-center border border-white/20 text-white/70 py-2.5 rounded transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-semibold bg-gold text-navy py-2.5 rounded text-center transition-colors hover:bg-gold/90"
            >
              Register Your Club
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
