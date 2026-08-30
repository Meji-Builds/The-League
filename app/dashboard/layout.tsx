import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavHeader } from "@/components/NavHeader";

const navItems = [
  { label: "Overview",     href: "/dashboard" },
  { label: "Roster",       href: "/dashboard/roster" },
  { label: "Competitions", href: "/dashboard/competitions" },
  { label: "Fixtures",     href: "/dashboard/fixtures" },
  { label: "Results",      href: "/dashboard/results" },
  { label: "Updates",      href: "/dashboard/updates" },
  { label: "Profile",      href: "/dashboard/profile" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <NavHeader brand="The League" items={navItems} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {children}
      </main>
    </div>
  );
}
