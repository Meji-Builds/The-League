import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { label: "Overview",     href: "/dashboard" },
  { label: "Roster",       href: "/dashboard/roster" },
  { label: "Competitions", href: "/dashboard/competitions" },
  { label: "Fixtures",     href: "/dashboard/fixtures" },
  { label: "Results",      href: "/dashboard/results" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top bar */}
      <header className="bg-navy border-b border-white/10 h-14 flex items-center px-4 sm:px-6 lg:px-8 gap-4">
        <Link href="/" className="text-gold font-bold tracking-widest uppercase text-sm mr-4">
          The League
        </Link>
        <nav className="flex items-center gap-4 overflow-x-auto">
          {navItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-white/60 hover:text-white text-sm whitespace-nowrap transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-white/40 hover:text-white text-xs transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {children}
      </main>
    </div>
  );
}
