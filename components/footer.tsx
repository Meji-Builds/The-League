import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-navy border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-gold font-bold tracking-widest uppercase text-sm">
              The League
            </span>
            <p className="mt-3 text-white/50 text-xs leading-relaxed">
              University esports — officially organized, seriously competitive.
            </p>
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

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} The League. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">Season 1</p>
        </div>
      </div>
    </footer>
  );
}
