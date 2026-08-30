import { createClient } from "@/lib/supabase/server";
import { FeeForm } from "./FeeForm";

export const metadata = { title: "Admin — Settings" };

export default async function AdminSettingsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const { data: feeRow } = await db
    .from("fee_settings")
    .select("owner_registration_fee, updated_at")
    .eq("id", 1)
    .single();

  const currentFee = feeRow?.owner_registration_fee ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-8">Settings</h1>

      <div className="max-w-md">
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
      </div>
    </div>
  );
}
