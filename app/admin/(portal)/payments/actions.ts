"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function confirmCompetitionPayment(formData: FormData) {
  const entryId      = formData.get("entry_id")       as string;
  const clubId       = formData.get("club_id")        as string;
  const competitionId = formData.get("competition_id") as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  await db
    .from("competition_entries")
    .update({ payment_status: "paid" })
    .eq("id", entryId);

  // Also mark the linked payment record as succeeded if one exists
  await db
    .from("payments")
    .update({ status: "success" })
    .eq("type", "competition_entry")
    .eq("club_id", clubId)
    .eq("competition_id", competitionId)
    .eq("status", "pending");

  revalidatePath("/admin/payments");
}
