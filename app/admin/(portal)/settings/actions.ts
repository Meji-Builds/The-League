"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/admin/login");
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

export async function updateSiteSettings(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const payload = {
    id: 1,
    social_youtube:     (formData.get("social_youtube")     as string).trim() || null,
    social_instagram:   (formData.get("social_instagram")   as string).trim() || null,
    social_twitter:     (formData.get("social_twitter")     as string).trim() || null,
    social_tiktok:      (formData.get("social_tiktok")      as string).trim() || null,
    social_discord:     (formData.get("social_discord")     as string).trim() || null,
    about_text:         (formData.get("about_text")         as string).trim() || null,
    contact_email:      (formData.get("contact_email")      as string).trim() || null,
    hero_title:         (formData.get("hero_title")         as string).trim() || "University Esports, Officially Organized.",
    hero_subtitle:      (formData.get("hero_subtitle")      as string).trim() || null,
    hero_bg_image_url:  (formData.get("hero_bg_image_url")  as string).trim() || null,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  let { error } = await db.from("site_settings").upsert(payload, { onConflict: "id" });

  // hero_bg_image_url column may not exist yet — retry without it
  if (error?.message?.includes("hero_bg_image_url")) {
    const { hero_bg_image_url: _omit, ...payloadWithout } = payload;
    ({ error } = await db.from("site_settings").upsert(payloadWithout, { onConflict: "id" }));
  }

  if (error) {
    console.error("admin/updateSiteSettings:", error);
    return { error: "Could not save settings. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { success: true };
}
