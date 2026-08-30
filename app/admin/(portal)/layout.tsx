import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavHeader } from "@/components/NavHeader";

// Admin access is determined by checking Supabase's app_metadata for role="admin".
// This is set manually in the Supabase dashboard for each admin user.
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/admin/login");
  return user;
}

const navItems = [
  { label: "Overview",      href: "/admin" },
  { label: "Clubs",         href: "/admin/clubs" },
  { label: "Competitions",  href: "/admin/competitions" },
  { label: "Fixtures",      href: "/admin/fixtures" },
  { label: "Results",       href: "/admin/results" },
  { label: "Disputes",      href: "/admin/disputes" },
  { label: "Standings",     href: "/admin/standings" },
  { label: "Club Posts",    href: "/admin/club-posts" },
  { label: "News",          href: "/admin/announcements" },
  { label: "Highlights",    href: "/admin/highlights" },
  { label: "Sponsors",      href: "/admin/sponsors" },
  { label: "Streams",       href: "/admin/livestreams" },
  { label: "Settings",      href: "/admin/settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <NavHeader brand="The League" badge="Admin" items={navItems} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>
    </div>
  );
}
