import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ThemeStyle } from "@/components/ThemeStyle";
import { getSiteSettings } from "@/lib/site-settings";
import type React from "react";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <>
      <ThemeStyle />
      <Nav siteName={settings.site_name} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
    </>
  );
}
