import { getSignedUploadUrl, getIdCardUploadUrl } from "@/app/actions/upload";

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function putToSignedUrl(signedUrl: string, file: File): Promise<boolean> {
  const res = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "apikey": SUPABASE_ANON_KEY,
      "x-upsert": "false",
    },
  });

  if (!res.ok) {
    console.error("directUpload: PUT failed", res.status, await res.text().catch(() => ""));
  }

  return res.ok;
}

export async function directUpload(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const result = await getSignedUploadUrl(folder, ext);

  if ("error" in result) {
    console.error("directUpload: signed URL error:", result.error);
    return null;
  }

  const ok = await putToSignedUrl(result.signedUrl, file);
  return ok ? result.publicUrl : null;
}

export async function directUploadIdCard(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const result = await getIdCardUploadUrl(ext);

  if ("error" in result) {
    console.error("directUploadIdCard: signed URL error:", result.error);
    return null;
  }

  const ok = await putToSignedUrl(result.signedUrl, file);
  return ok ? result.storagePath : null;
}
