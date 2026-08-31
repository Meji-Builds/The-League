import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EnterButton } from "./EnterButton";

export const metadata = { title: "Competitions" };

interface Competition {
  id: string;
  name: string;
  slug: string;
  type: string;
  edition: string;
  entry_fee: number;
  status: string;
  description: string | null;
}

interface Entry {
  competition_id: string;
  payment_status: string;
}

export default async function CompetitionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: owner } = await db
    .from("club_owners")
    .select("club_id, owner_registration_payment_status")
    .eq("user_id", user.id)
    .single();

  if (!owner?.club_id) redirect("/dashboard/onboarding");

  const [{ data: rawCompetitions }, { data: rawEntries }] = await Promise.all([
    db.from("competitions").select("id, name, slug, type, edition, entry_fee, status, description").order("status"),
    db.from("competition_entries").select("competition_id, payment_status").eq("club_id", owner.club_id),
  ]);

  const competitions = (rawCompetitions ?? []) as Competition[];
  const entries      = (rawEntries      ?? []) as Entry[];
  const entryMap     = new Map(entries.map((e) => [e.competition_id, e]));

  const open   = competitions.filter((c) => c.status === "registration_open");
  const others = competitions.filter((c) => c.status !== "registration_open");

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Dashboard</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Competitions</h1>
        <p className="text-white/40 text-[13px] mt-2">Browse open competitions and enter your club.</p>
      </div>

      {owner.owner_registration_payment_status === "unpaid" && (
        <div className="border border-danger/30 border-l-[3px] border-l-danger bg-card px-5 py-4 mb-8">
          <p className="font-semibold text-white text-sm">Registration fee unpaid.</p>
          <p className="text-white/40 text-[13px] mt-1">Pay the owner registration fee before entering competitions.</p>
          <a
            href="/dashboard/onboarding?step=2"
            className="mt-3 inline-block bg-gold text-navy font-bold text-xs px-4 py-2 rounded hover:bg-gold/90 transition-colors"
          >
            Complete payment
          </a>
        </div>
      )}

      {open.length > 0 && (
        <section className="mb-10">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Open for registration</p>
          <div className="border border-white/6 divide-y divide-white/5">
            {open.map((comp) => {
              const entry = entryMap.get(comp.id);
              return (
                <div key={comp.id} className="bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-white text-sm">{comp.name}</p>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 border border-white/10 px-2 py-0.5">{comp.edition}</span>
                    </div>
                    {comp.description && <p className="text-white/40 text-[13px]">{comp.description}</p>}
                    <p className="text-[13px] font-medium text-white/60 mt-2">
                      Entry fee: {comp.entry_fee > 0 ? `NGN ${comp.entry_fee.toLocaleString()}` : "Free"}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {!entry ? (
                      <EnterButton
                        competitionId={comp.id}
                        competitionName={comp.name}
                        entryFee={comp.entry_fee}
                        disabled={owner.owner_registration_payment_status === "unpaid"}
                      />
                    ) : entry.payment_status === "paid" ? (
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-success">Entered</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">Payment pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Other competitions</p>
          <div className="border border-white/6 divide-y divide-white/5">
            {others.map((comp) => {
              const entry = entryMap.get(comp.id);
              return (
                <div key={comp.id} className="bg-card p-4 flex items-center gap-4 opacity-60">
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{comp.name} <span className="text-white/30 font-normal">— {comp.edition}</span></p>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/30 capitalize">{comp.status.replace("_", " ")}</div>
                  {entry?.payment_status === "paid" && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-success">Entered</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {competitions.length === 0 && (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No competitions available yet.</p>
        </div>
      )}
    </div>
  );
}
