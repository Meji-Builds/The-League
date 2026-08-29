import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Paystack calls this endpoint after every transaction.
// We verify the signature, then update payment status in the database.
// Never trust the client-side callback — all status changes happen here.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  const expectedSignature = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { reference, status } = event.data;

    if (status !== "success") {
      return NextResponse.json({ received: true });
    }

    const supabase = await createClient();

    // Mark the payment record as succeeded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: payment, error } = await db
      .from("payments")
      .update({ status: "success" })
      .eq("paystack_reference", reference)
      .select("type, club_id, competition_id")
      .single();

    if (error || !payment) {
      console.error("Paystack webhook: payment record not found for reference", reference);
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // Update the relevant entity based on payment type
    if (payment.type === "owner_registration") {
      await db
        .from("club_owners")
        .update({ owner_registration_payment_status: "paid" })
        .eq("club_id", payment.club_id);
    } else if (payment.type === "competition_entry" && payment.competition_id) {
      await db
        .from("competition_entries")
        .update({ payment_status: "paid" })
        .eq("club_id", payment.club_id)
        .eq("competition_id", payment.competition_id);
    }
  }

  return NextResponse.json({ received: true });
}
