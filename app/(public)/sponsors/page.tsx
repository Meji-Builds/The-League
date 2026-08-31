import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";
import type { GlobalSponsor } from "@/types/database";

export const metadata = { title: "Sponsors" };

async function getSponsors(): Promise<GlobalSponsor[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("global_sponsors")
      .select("*")
      .order("display_order");
    return data ?? [];
  } catch {
    return [];
  }
}

const tierAccent: Record<string, string> = {
  title:  "border-gold",
  gold:   "border-warning/60",
  silver: "border-white/20",
  bronze: "border-white/10",
};

export default async function SponsorsPage() {
  const [sponsors, s] = await Promise.all([getSponsors(), getSiteSettings()]);
  const byTier = (tier: GlobalSponsor["tier"]) => sponsors.filter((sp) => sp.tier === tier);

  const tiers: { key: GlobalSponsor["tier"]; label: string; description: string }[] = [
    { key: "title",  label: s.tier_title_name,  description: s.tier_title_description  },
    { key: "gold",   label: s.tier_gold_name,   description: s.tier_gold_description   },
    { key: "silver", label: s.tier_silver_name, description: s.tier_silver_description },
    { key: "bronze", label: s.tier_bronze_name, description: s.tier_bronze_description },
  ];

  return (
    <div>
      {/* Header */}
      <section className="bg-navy border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-6">Partnerships</p>
          <h1 className="font-display font-black uppercase leading-none text-white" style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}>
            Sponsor<br />{s.site_name}
          </h1>
          <p className="text-white/40 max-w-xl text-[15px] leading-relaxed mt-6">
            {s.sponsors_description}
          </p>
          <a
            href={`mailto:${s.sponsorship_email}`}
            className="mt-10 inline-block text-[11px] font-black uppercase tracking-[0.15em] border border-gold text-gold px-7 py-3.5 hover:bg-gold hover:text-navy transition-all"
          >
            Get in touch
          </a>
        </div>
      </section>

      {/* Tier breakdown */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-10">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Packages</p>
          <h2 className="font-display font-black text-[2rem] text-white uppercase leading-none">Sponsorship Tiers</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-px bg-white/5 border border-white/5 mb-20">
          {tiers.map(({ key, label, description }) => {
            const tierSponsors = byTier(key);
            return (
              <div
                key={key}
                className={`bg-card p-7 relative border-l-[3px] ${tierAccent[key] ?? "border-white/10"}`}
              >
                <h3 className="font-display font-black text-lg text-white uppercase mb-3">{label}</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-5">{description}</p>

                {tierSponsors.length > 0 ? (
                  <div className="flex flex-wrap gap-8 pt-5 border-t border-white/6">
                    {tierSponsors.map((s) =>
                      s.website_url ? (
                        <a
                          key={s.id}
                          href={s.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-75 hover:opacity-100 transition-opacity"
                        >
                          <Image src={s.logo_url} alt={s.name} width={160} height={64} className="object-contain h-16" />
                        </a>
                      ) : (
                        <Image key={s.id} src={s.logo_url} alt={s.name} width={160} height={64} className="object-contain h-16 opacity-75" />
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/20 italic pt-5 border-t border-white/6">
                    Available — contact us to learn more.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="border border-white/6 p-10 text-center bg-card">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Partner with us</p>
          <h3 className="font-display font-black text-2xl text-white uppercase mb-3">Interested in partnering?</h3>
          <p className="text-white/35 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            {s.sponsors_cta_description}
          </p>
          <a
            href={`mailto:${s.sponsorship_email}`}
            className="inline-block text-[11px] font-black uppercase tracking-[0.15em] bg-gold text-navy px-7 py-3.5 hover:brightness-105 transition-all"
          >
            Email us
          </a>
        </div>
      </div>
    </div>
  );
}
