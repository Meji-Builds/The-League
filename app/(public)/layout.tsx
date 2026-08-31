import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { getSiteSettings } from "@/lib/site-settings";
import type React from "react";

function isValidHex(v: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(v);
}

function mix(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

function buildThemeCSS(gold: string, cobalt: string, navy: string): string {
  return `
:root{--color-gold:${gold};--color-cobalt:${cobalt};--color-navy:${navy}}
body{background-color:${navy}}
.text-gold{color:${gold}!important}
.text-gold\\/40{color:${mix(gold,40)}!important}
.bg-gold{background-color:${gold}!important}
.bg-gold\\/5{background-color:${mix(gold,5)}!important}
.bg-gold\\/10{background-color:${mix(gold,10)}!important}
.bg-gold\\/15{background-color:${mix(gold,15)}!important}
.bg-gold\\/90{background-color:${mix(gold,90)}!important}
.border-gold{border-color:${gold}!important}
.text-cobalt{color:${cobalt}!important}
.text-cobalt\\/40{color:${mix(cobalt,40)}!important}
.text-cobalt\\/50{color:${mix(cobalt,50)}!important}
.bg-cobalt\\/10{background-color:${mix(cobalt,10)}!important}
.bg-cobalt\\/15{background-color:${mix(cobalt,15)}!important}
.border-cobalt\\/50{border-color:${mix(cobalt,50)}!important}
.text-navy{color:${navy}!important}
.bg-navy{background-color:${navy}!important}
.bg-navy\\/75{background-color:${mix(navy,75)}!important}
.bg-navy\\/80{background-color:${mix(navy,80)}!important}
.bg-navy\\/95{background-color:${mix(navy,95)}!important}
.from-navy\\/75{--tw-gradient-from:${mix(navy,75)}!important}
.from-navy\\/80{--tw-gradient-from:${mix(navy,80)}!important}
.via-navy\\/20{--tw-gradient-via:${mix(navy,20)}!important}
`.trim();
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  const gold   = settings.theme_gold   && isValidHex(settings.theme_gold)   ? settings.theme_gold   : null;
  const cobalt = settings.theme_cobalt && isValidHex(settings.theme_cobalt) ? settings.theme_cobalt : null;
  const navy   = settings.theme_navy   && isValidHex(settings.theme_navy)   ? settings.theme_navy   : null;

  const hasCustomTheme = gold && cobalt && navy;
  const themeCSS = hasCustomTheme ? buildThemeCSS(gold, cobalt, navy) : null;

  return (
    <>
      {themeCSS && (
        // eslint-disable-next-line react/no-danger
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      )}
      <Nav siteName={settings.site_name} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
    </>
  );
}
