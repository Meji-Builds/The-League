import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") ?? "";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieHeader
            .split(";")
            .filter(Boolean)
            .map((c) => {
              const idx = c.indexOf("=");
              if (idx === -1) return { name: c.trim(), value: "" };
              return { name: c.slice(0, idx).trim(), value: c.slice(idx + 1).trim() };
            });
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bucket = (formData.get("bucket") as string | null) ?? "media";

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  let storagePath: string;

  if (bucket === "id-cards") {
    const { data: owner } = await (supabase as any)
      .from("club_owners")
      .select("club_id")
      .eq("user_id", user.id)
      .single();
    if (!owner?.club_id) {
      return NextResponse.json({ error: "Not a club owner" }, { status: 403 });
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    storagePath = `${owner.club_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  } else {
    const folder = formData.get("folder") as string | null;
    if (!folder) return NextResponse.json({ error: "No folder provided" }, { status: 400 });
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  }

  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(storagePath, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    console.error("upload route:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (bucket === "media") {
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return NextResponse.json({ url: publicUrl });
  }

  return NextResponse.json({ path: storagePath });
}
