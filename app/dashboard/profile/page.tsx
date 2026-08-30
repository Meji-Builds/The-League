import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClubProfileForm } from "./ClubProfileForm";

export const metadata = { title: "Club Profile" };

export default async function ClubProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: club } = await db
    .from("clubs")
    .select("name, faculty, bio, logo_url, logo_status, badge_url")
    .eq("owner_id", user.id)
    .single();

  if (!club) redirect("/dashboard/onboarding");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Club Profile</h1>
        <p className="text-muted text-sm mt-1">
          Update your club name, bio, logo, and badge/cover photo.
        </p>
      </div>

      <div className="border border-border bg-white rounded p-6">
        <ClubProfileForm
          name={club.name}
          faculty={club.faculty}
          bio={club.bio}
          logo_url={club.logo_url}
          logo_status={club.logo_status}
          badge_url={club.badge_url}
        />
      </div>
    </div>
  );
}
