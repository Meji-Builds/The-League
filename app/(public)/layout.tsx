import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { createClient } from "@/lib/supabase/server";
import type React from "react";

async function getSiteTheme(): Promise<Record<string, string>> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("theme_gold, theme_cobalt, theme_navy")
      .eq("id", 1)
      .single();
    return data ?? {};
  } catch {
    return {};
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const theme = await getSiteTheme();

  const themeStyle = {
    ...(theme.theme_gold   ? { "--color-gold":   theme.theme_gold   } : {}),
    ...(theme.theme_cobalt ? { "--color-cobalt": theme.theme_cobalt } : {}),
    ...(theme.theme_navy   ? { "--color-navy":   theme.theme_navy   } : {}),
  } as React.CSSProperties;

  const hasTheme = Object.keys(themeStyle).length > 0;

  return (
    <div style={hasTheme ? themeStyle : undefined}>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
