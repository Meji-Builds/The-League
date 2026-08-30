"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getSignedUploadUrl(
  folder: string,
  ext: string,
): Promise<{ token: string; path: string; publicUrl: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("getSignedUploadUrl:", error);
    return { error: "Could not prepare upload. Please try again." };
  }

  const publicUrl = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  return { token: data.token, path, publicUrl };
}

export async function getIdCardUploadUrl(
  ext: string,
): Promise<{ token: string; storagePath: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: owner } = await (supabase as any)
    .from("club_owners")
    .select("club_id")
    .eq("user_id", user.id)
    .single();

  if (!owner?.club_id) redirect("/dashboard/onboarding");

  const storagePath = `${owner.club_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("id-cards")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    console.error("getIdCardUploadUrl:", error);
    return { error: "Could not prepare upload. Please try again." };
  }

  return { token: data.token, storagePath };
}
