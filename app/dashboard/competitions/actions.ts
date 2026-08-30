"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function enterCompetition(competitionId: string): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: owner } = await db
    .from("club_owners")
    .select("id, club_id, owner_registration_payment_status")
    .eq("user_id", user.id)
    .single();

  if (!owner?.club_id) return { error: "No club found." };
  if (owner.owner_registration_payment_status === "unpaid") {
    return { error: "Pay the owner registration fee before entering competitions." };
  }

  // Check not already entered.
  const { data: existing } = await db
    .from("competition_entries")
    .select("id, payment_status")
    .eq("club_id", owner.club_id)
    .eq("competition_id", competitionId)
    .single();

  if (existing) return { error: "Your club is already entered in this competition." };

  // Fetch competition details for fee and name.
  const { data: comp } = await db
    .from("competitions")
    .select("id, name, entry_fee, status")
    .eq("id", competitionId)
    .single();

  if (!comp || comp.status !== "registration_open") {
    return { error: "This competition is not open for registration." };
  }

  // Free competitions: create entry directly without payment.
  if (comp.entry_fee === 0) {
    await db.from("competition_entries").insert({
      club_id: owner.club_id,
      competition_id: competitionId,
      payment_status: "paid",
    });
    return null;
  }

  // Paid competitions: create entry + payment record, then redirect to Paystack.
  const reference = `comp-entry-${owner.club_id}-${competitionId}-${Date.now()}`;

  const { error: entryError } = await db.from("competition_entries").insert({
    club_id: owner.club_id,
    competition_id: competitionId,
    payment_status: "unpaid",
  });
  if (entryError) return { error: "Could not create entry record. Please try again." };

  const { error: paymentError } = await db.from("payments").insert({
    type: "competition_entry",
    club_id: owner.club_id,
    competition_id: competitionId,
    amount: comp.entry_fee,
    paystack_reference: reference,
    status: "pending",
  });
  if (paymentError) return { error: "Could not create payment record. Please try again." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: comp.entry_fee * 100,
      reference,
      callback_url: `${appUrl}/dashboard/competitions`,
      metadata: {
        custom_fields: [
          { display_name: "Payment Type",    variable_name: "payment_type",    value: "competition_entry" },
          { display_name: "Competition",     variable_name: "competition_name", value: comp.name },
          { display_name: "Club ID",         variable_name: "club_id",          value: owner.club_id },
          { display_name: "Competition ID",  variable_name: "competition_id",   value: competitionId },
        ],
      },
    }),
  });

  if (!paystackRes.ok) return { error: "Payment initialization failed. Please try again." };

  const { data: paystackData } = await paystackRes.json() as {
    data: { authorization_url: string };
  };

  redirect(paystackData.authorization_url);
}
