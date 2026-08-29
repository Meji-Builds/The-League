import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

const tiers: { key: GlobalSponsor["tier"]; label: string; description: string }[] = [
  {
    key: "title",
    label: "Title Sponsor",
    description:
      "Full naming rights to the season. Maximum logo placement across all competition materials, streams, and digital surfaces.",
  },
  {
    key: "gold",
    label: "Gold Partner",
    description:
      "Premium placement on fixtures, standings, and the club directory. Named in all official communications.",
  },
  {
    key: "silver",
    label: "Silver Partner",
    description:
      "Logo placement on the public site and match day materials. Named in season announcements.",
  },
  {
    key: "bronze",
    label: "Bronze Partner",
    description:
      "Logo on the sponsors page and acknowledgement in season communications.",
  },
];

export default async function SponsorsPage() {
  const sponsors = await getSponsors();
  const byTier = (tier: GlobalSponsor["tier"]) => sponsors.filter((s) => s.tier === tier);

  return (
    <div>
      {/* Header */}
      <div className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-gold text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            Partnerships
          </p>
          <h1 className="text-4xl font-bold mb-4">Sponsor The League</h1>
          <p className="text-white/60 max-w-xl text-base leading-relaxed">
            The League is the official governing body for university esports. We
            run structured competitions across departments, faculties, and the
            university — with a growing audience of students, alumni, and fans.
          </p>
          <a
            href="mailto:sponsorship@theleague.ng"
            className="mt-8 inline-block border border-gold text-gold text-sm font-semibold px-6 py-3 rounded hover:bg-gold hover:text-navy transition-colors"
          >
            Get in touch
          </a>
        </div>
      </div>

      {/* Tier breakdown */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-xl font-bold text-navy mb-8">Sponsorship Tiers</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {tiers.map(({ key, label, description }) => {
            const tierSponsors = byTier(key);
            return (
              <div
                key={key}
                className={`border bg-white p-6 ${
                  key === "title" ? "border-gold" : "border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {key === "title" && (
                    <span className="w-2 h-2 bg-gold inline-block" />
                  )}
                  <h3 className="font-bold text-navy">{label}</h3>
                </div>
                <p className="text-muted text-sm leading-relaxed mb-4">{description}</p>

                {tierSponsors.length > 0 ? (
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
                    {tierSponsors.map((s) =>
                      s.website_url ? (
                        <a
                          key={s.id}
                          href={s.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-80 hover:opacity-100 transition-opacity"
                        >
                          <Image src={s.logo_url} alt={s.name} width={100} height={40} className="object-contain h-10" />
                        </a>
                      ) : (
                        <Image key={s.id} src={s.logo_url} alt={s.name} width={100} height={40} className="object-contain h-10 opacity-80" />
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted italic mt-4 pt-4 border-t border-border">
                    Available — contact us to learn more.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="bg-surface border border-border p-8 text-center">
          <h3 className="text-lg font-bold text-navy mb-2">Interested in partnering?</h3>
          <p className="text-muted text-sm mb-6 max-w-md mx-auto">
            We work with sponsors to build custom packages that fit your goals. Reach
            out and we will put together a proposal.
          </p>
          <a
            href="mailto:sponsorship@theleague.ng"
            className="inline-block bg-gold text-navy text-sm font-semibold px-6 py-3 rounded hover:bg-gold/90 transition-colors"
          >
            Email us
          </a>
        </div>
      </div>
    </div>
  );
}
