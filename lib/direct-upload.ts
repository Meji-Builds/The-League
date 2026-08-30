import { createClient } from "@/lib/supabase/client";
import { getSignedUploadUrl, getIdCardUploadUrl } from "@/app/actions/upload";

export async function directUpload(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const result = await getSignedUploadUrl(folder, ext);

  if ("error" in result) {
    console.error("directUpload (getSignedUrl):", result.error);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;
  const { error } = await supabase.storage
    .from("media")
    .uploadToSignedUrl(result.path, result.token, file, {
      contentType: file.type || "application/octet-stream",
    });

  if (error) {
    console.error("directUpload (upload):", error.message);
    return null;
  }

  return result.publicUrl;
}

export async function directUploadIdCard(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const result = await getIdCardUploadUrl(ext);

  if ("error" in result) {
    console.error("directUploadIdCard (getSignedUrl):", result.error);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;
  const { error } = await supabase.storage
    .from("id-cards")
    .uploadToSignedUrl(result.storagePath, result.token, file, {
      contentType: file.type || "application/octet-stream",
    });

  if (error) {
    console.error("directUploadIdCard (upload):", error.message);
    return null;
  }

  return result.storagePath;
}
