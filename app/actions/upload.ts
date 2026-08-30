"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Service-role client bypasses RLS for storage operations.
// Set SUPABASE_SERVICE_ROLE_KEY in Vercel env vars (Supabase dashboard → Settings → API → service_role).
function storageAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function getSignedUploadUrl(
  folder: string,
  ext: string,
): Promise<{ token: string; path: string; publicUrl: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const admin = storageAdmin();

  const { data, error } = await admin.storage.from("media").createSignedUploadUrl(path);

  if (error || !data) {
    console.error("getSignedUploadUrl:", error);
    return { error: "Could not prepare upload. Please try again." };
  }

  const publicUrl = admin.storage.from("media").getPublicUrl(path).data.publicUrl;
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
  const admin = storageAdmin();

  const { data, error } = await admin.storage.from("id-cards").createSignedUploadUrl(storagePath);

  if (error || !data) {
    console.error("getIdCardUploadUrl:", error);
    return { error: "Could not prepare upload. Please try again." };
  }

  return { token: data.token, storagePath };
}
