"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getSignedUploadUrl(
  folder: string,
  ext: string,
): Promise<{ signedUrl: string; publicUrl: string } | { error: string }> {
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
  return { signedUrl: data.signedUrl, publicUrl };
}
