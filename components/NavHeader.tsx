"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
}

interface Props {
  brand: string;
  badge?: string;
  items: NavItem[];
}

export function NavHeader({ brand, badge, items }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" || href === "/admin"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <header className="bg-navy border-b border-white/10 relative z-40">
      <div className="h-14 flex items-center px-4 sm:px-6 gap-4">
        {/* Brand */}
        <Link
          href="/"
          className="text-gold font-bold tracking-widest uppercase text-sm shrink-0 mr-2"
          onClick={() => setOpen(false)}
        >
          {brand}
        </Link>

        {badge && (
          <span className="hidden sm:block text-white/20 text-xs uppercase tracking-widest shrink-0">
            {badge}
          </span>
        )}

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 overflow-x-auto flex-1">
          {items.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm whitespace-nowrap transition-colors shrink-0 ${
                isActive(href) ? "text-gold font-semibold" : "text-white/60 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop sign out */}
        <div className="hidden md:block ml-auto shrink-0">
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-white/40 hover:text-white text-xs transition-colors">
              Sign out
            </button>
          </form>
        </div>

        {/* Mobile: sign out + hamburger */}
        <div className="flex items-center gap-3 ml-auto md:hidden">
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-white/40 hover:text-white text-xs transition-colors">
              Sign out
            </button>
          </form>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="text-white/60 hover:text-white p-1 -mr-1"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden absolute top-14 inset-x-0 bg-navy border-b border-white/10 shadow-lg">
          <nav className="flex flex-col px-4 py-2">
            {items.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`py-3 text-sm border-b border-white/5 last:border-0 transition-colors ${
                  isActive(href) ? "text-gold font-semibold" : "text-white/70"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
