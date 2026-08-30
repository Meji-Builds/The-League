import { getSignedUploadUrl } from "@/app/actions/upload";

export async function directUpload(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const result = await getSignedUploadUrl(folder, ext);

  if ("error" in result) {
    console.error("directUpload:", result.error);
    return null;
  }

  const { signedUrl, publicUrl } = result;

  const res = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });

  if (!res.ok) {
    console.error("directUpload: PUT failed", res.status, await res.text());
    return null;
  }

  return publicUrl;
}
