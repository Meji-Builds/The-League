import { createClient } from "@/lib/supabase/server";
import { FeeForm } from "./FeeForm";
import { SiteSettingsForm } from "./SiteSettingsForm";
import { ThemeForm } from "./ThemeForm";

export const metadata = { title: "Admin — Settings" };

export default async function AdminSettingsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const [{ data: feeRow }, { data: siteRow }] = await Promise.all([
    db.from("fee_settings").select("owner_registration_fee, updated_at").eq("id", 1).single(),
    db.from("site_settings").select("*").eq("id", 1).single(),
  ]);

  const currentFee = feeRow?.owner_registration_fee ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-8">Settings</h1>

      <div className="max-w-lg flex flex-col gap-6">
        <section className="border border-border bg-white rounded p-5">
          <h2 className="text-navy font-semibold text-sm mb-4">Registration fees</h2>
          <FeeForm currentFee={currentFee} />
          {feeRow?.updated_at && (
            <p className="text-muted text-xs mt-4">
              Last updated: {new Date(feeRow.updated_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          )}
        </section>

        <section className="border border-border bg-white rounded p-5">
          <h2 className="text-navy font-semibold text-sm mb-4">Social &amp; Livestream</h2>
          <SiteSettingsForm settings={siteRow ?? null} />
        </section>

        <section className="border border-border bg-white rounded p-5">
          <h2 className="text-navy font-semibold text-sm mb-1">Theme</h2>
          <p className="text-muted text-xs mb-4">
            Changes the accent and background colours on all public-facing pages. The admin panel is unaffected.
          </p>
          <ThemeForm
            current={siteRow ?? null}
            history={siteRow?.theme_history ?? []}
          />
        </section>
      </div>
    </div>
  );
}
