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
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Settings</h1>
      </div>

      <div className="max-w-lg flex flex-col gap-6">
        <section className="border border-white/6 bg-card p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Registration Fees</p>
          <FeeForm currentFee={currentFee} />
          {feeRow?.updated_at && (
            <p className="text-white/25 text-[11px] mt-4">
              Last updated: {new Date(feeRow.updated_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          )}
        </section>

        <section className="border border-white/6 bg-card p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Social &amp; Livestream</p>
          <SiteSettingsForm settings={siteRow ?? null} />
        </section>

        <section className="border border-white/6 bg-card p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-1">Theme</p>
          <p className="text-white/30 text-[11px] mb-4">
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
