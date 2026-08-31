"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type ActionState = { error: string } | { redirect: string } | null;

// Step 1: Create the club and owner record.
export async function setupClub(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { redirect: "/login" };

  const name       = (formData.get("name") as string)?.trim();
  const department = (formData.get("department") as string)?.trim() || null;
  const faculty    = (formData.get("faculty") as string)?.trim();
  const bio        = (formData.get("bio") as string)?.trim() || null;

  if (!name || !faculty) {
    return { error: "Club name and faculty are required." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check if this user already has an owner record to avoid duplicates.
  const { data: existing } = await db
    .from("club_owners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { redirect: "/dashboard/onboarding?step=2" };
  }

  // Build a URL-safe slug from the club name.
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data: slugConflict } = await db
    .from("clubs")
    .select("id")
    .eq("slug", baseSlug)
    .single();

  const slug = slugConflict
    ? `${baseSlug}-${user.id.slice(0, 6)}`
    : baseSlug;

  // Create the club record.
  const { data: club, error: clubError } = await db
    .from("clubs")
    .insert({
      name,
      slug,
      department,
      faculty,
      bio,
      owner_id: user.id,
      status: "pending",
      logo_url: null,
      badge_url: null,
      merch: [],
      sponsors: [],
    })
    .select("id")
    .single();

  if (clubError) {
    console.error("onboarding/setupClub: club insert failed", clubError);
    return { error: "Could not create club. Please try again." };
  }

  // Create the owner record linked to the new club.
  const { error: ownerError } = await db
    .from("club_owners")
    .insert({
      user_id: user.id,
      name: (user.user_metadata?.full_name as string) || "",
      email: user.email ?? "",
      phone: (user.user_metadata?.phone as string) || null,
      owner_registration_payment_status: "unpaid",
      club_id: club.id,
    });

  if (ownerError) {
    console.error("onboarding/setupClub: owner insert failed", ownerError);
    // Roll back the club we just created.
    await db.from("clubs").delete().eq("id", club.id);
    return { error: "Could not save owner record. Please try again." };
  }

  revalidatePath("/dashboard/onboarding");
  return { redirect: "/dashboard/onboarding?step=2" };
}

// Step 2: Initialize a Paystack transaction for the owner registration fee.
// On success, returns a redirect URL for the client to follow.
export async function initiatePayment(prevState: ActionState, _formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { redirect: "/login" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Fetch the owner + club records.
  const { data: owner } = await db
    .from("club_owners")
    .select("id, club_id, owner_registration_payment_status")
    .eq("user_id", user.id)
    .single();

  if (!owner) {
    return { error: "Owner record not found. Please complete step 1 first." };
  }

  if (owner.owner_registration_payment_status === "paid") {
    return { redirect: "/dashboard/onboarding?step=3" };
  }

  // Fetch the registration fee (in naira). Default to 5,000 NGN if not configured.
  const { data: feeRow } = await db
    .from("fee_settings")
    .select("owner_registration_fee")
    .limit(1)
    .single();

  const feeNaira = feeRow?.owner_registration_fee ?? 5000;

  // Free registration — skip Paystack entirely.
  if (feeNaira === 0) {
    await db
      .from("club_owners")
      .update({ owner_registration_payment_status: "paid" })
      .eq("user_id", user.id);
    return { redirect: "/dashboard/onboarding?step=3" };
  }

  const feeKobo  = feeNaira * 100; // Paystack uses the smallest currency unit

  // Generate a unique reference.
  const reference = `owner-reg-${owner.id}-${Date.now()}`;

  // Create a pending payment record before calling Paystack so the webhook
  // can find it by reference when Paystack calls back.
  const { error: paymentError } = await db
    .from("payments")
    .insert({
      type: "owner_registration",
      club_id: owner.club_id,
      competition_id: null,
      amount: feeNaira,
      paystack_reference: reference,
      status: "pending",
    });

  if (paymentError) {
    console.error("onboarding/initiatePayment: payment insert failed", paymentError);
    return { error: "Could not create payment record. Please try again." };
  }

  // Call the Paystack initialization API.
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: feeKobo,
      reference,
      callback_url: `${appUrl}/dashboard/onboarding?step=3`,
      metadata: {
        custom_fields: [
          { display_name: "Payment Type", variable_name: "payment_type", value: "owner_registration" },
          { display_name: "Club ID",       variable_name: "club_id",       value: owner.club_id },
        ],
      },
    }),
  });

  if (!paystackRes.ok) {
    const body = await paystackRes.text();
    console.error("onboarding/initiatePayment: Paystack API error", body);
    return { error: "Payment initialization failed. Please try again." };
  }

  const { data: paystackData } = await paystackRes.json() as {
    data: { authorization_url: string; reference: string };
  };

  return { redirect: paystackData.authorization_url };
}
