import { createClient } from "@/lib/supabase/client";

function randomPath(folder: string, ext: string): string {
  return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

export async function directUpload(file: File, folder: string): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = randomPath(folder, ext);

  const { error } = await supabase.storage.from("media").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    console.error("directUpload:", error.message);
    return null;
  }

  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export async function directUploadIdCard(file: File): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: owner } = await supabase
    .from("club_owners")
    .select("club_id")
    .eq("user_id", user.id)
    .single();

  if (!owner?.club_id) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${owner.club_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from("id-cards").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    console.error("directUploadIdCard:", error.message);
    return null;
  }

  return path;
}
