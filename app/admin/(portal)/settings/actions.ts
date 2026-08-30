"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") throw new Error("Unauthorized");
  return { supabase, user };
}

type ActionState = { error: string } | { success: true } | null;

export async function updateFeeSettings(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();

  const registrationFee = parseFloat(formData.get("owner_registration_fee") as string);
  if (isNaN(registrationFee) || registrationFee < 0) {
    return { error: "Enter a valid fee amount (0 or higher)." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db.from("fee_settings").upsert({
    id: 1,
    owner_registration_fee: registrationFee,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }, { onConflict: "id" });

  if (error) {
    console.error("admin/updateFeeSettings:", error);
    return { error: "Could not save settings. Please try again." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
