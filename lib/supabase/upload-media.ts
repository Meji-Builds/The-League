import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadMedia(
  supabase: SupabaseClient,
  file: File,
  folder: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("uploadMedia:", error);
    return null;
  }
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
