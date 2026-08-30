export async function directUpload(file: File, folder: string): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  fd.append("bucket", "media");

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("directUpload:", data.error ?? res.statusText);
    return null;
  }
  const { url } = await res.json();
  return url ?? null;
}

export async function directUploadIdCard(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("bucket", "id-cards");

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("directUploadIdCard:", data.error ?? res.statusText);
    return null;
  }
  const { path } = await res.json();
  return path ?? null;
}
