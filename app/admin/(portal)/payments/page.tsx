import { createClient } from "@/lib/supabase/server";
import { confirmCompetitionPayment } from "./actions";

export const metadata = { title: "Admin — Payments" };

interface EntryRow {
  id:             string;
  payment_status: string;
  entered_at:     string;
  club_id:        string;
  competition_id: string;
  club:           { id: string; name: string } | null;
  competition:    { id: string; name: string; edition: string; entry_fee: number } | null;
}

interface PaymentRow {
  id:                 string;
  status:             string;
  amount:             number;
  paystack_reference: string;
  club_id:            string;
  competition_id:     string;
  created_at:         string;
}

export default async function AdminPaymentsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const [{ data: rawEntries }, { data: rawPayments }] = await Promise.all([
    db.from("competition_entries")
      .select("id, payment_status, entered_at, club_id, competition_id, club:clubs(id, name), competition:competitions(id, name, edition, entry_fee)")
      .order("entered_at", { ascending: false }),
    db.from("payments")
      .select("id, status, amount, paystack_reference, club_id, competition_id, created_at")
      .eq("type", "competition_entry")
      .order("created_at", { ascending: false }),
  ]);

  const entries  = (rawEntries  ?? []) as EntryRow[];
  const payments = (rawPayments ?? []) as PaymentRow[];

  // Build a lookup map: club_id+competition_id → payment record
  const paymentMap = new Map<string, PaymentRow>();
  for (const p of payments) {
    paymentMap.set(`${p.club_id}:${p.competition_id}`, p);
  }

  const pending = entries.filter((e) => e.payment_status !== "paid" && (e.competition?.entry_fee ?? 0) > 0);
  const paid    = entries.filter((e) => e.payment_status === "paid");
  const free    = entries.filter((e) => e.payment_status === "paid" && (e.competition?.entry_fee ?? 0) === 0);

  const pendingCount = pending.length;

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Payments</h1>
        <p className="text-white/40 text-[13px] mt-2">Competition entry payments — confirm offline or missed webhook payments.</p>
      </div>

      {/* Pending entries */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim">Pending</p>
          {pendingCount > 0 && (
            <span className="text-[9px] font-black bg-warning/10 text-warning px-2 py-0.5 uppercase tracking-widest">
              {pendingCount}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="border border-white/6 bg-card px-6 py-8 text-center">
            <p className="text-white/30 text-[13px]">No pending payments.</p>
          </div>
        ) : (
          <div className="border border-white/6 divide-y divide-white/5">
            {pending.map((entry) => {
              const payment = paymentMap.get(`${entry.club_id}:${entry.competition_id}`);
              return (
                <div key={entry.id} className="bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm text-white">{entry.club?.name ?? "Unknown club"}</p>
                      <span className="text-white/20 text-[11px]">entered</span>
                      <p className="text-[13px] text-white/60">{entry.competition?.name} <span className="text-white/25">{entry.competition?.edition}</span></p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-[11px] text-white/40">
                        Fee: <span className="text-white/60">NGN {(entry.competition?.entry_fee ?? 0).toLocaleString()}</span>
                      </span>
                      {payment ? (
                        <span className="text-[11px] text-white/40 font-mono">
                          Ref: <span className="text-white/50">{payment.paystack_reference}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-white/25">No payment record</span>
                      )}
                      <span className="text-[11px] text-white/25">
                        {new Date(entry.entered_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-warning">Payment Pending</span>
                    <form action={confirmCompetitionPayment}>
                      <input type="hidden" name="entry_id"       value={entry.id} />
                      <input type="hidden" name="club_id"        value={entry.club_id} />
                      <input type="hidden" name="competition_id" value={entry.competition_id} />
                      <button
                        type="submit"
                        className="text-xs font-bold px-4 py-2 bg-success/10 text-success hover:bg-success/20 transition-colors uppercase tracking-[0.1em]"
                      >
                        Confirm Paid
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmed paid entries */}
      {paid.length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">Confirmed</p>
          <div className="border border-white/6 divide-y divide-white/5">
            {paid.map((entry) => {
              const payment = paymentMap.get(`${entry.club_id}:${entry.competition_id}`);
              const isFree  = (entry.competition?.entry_fee ?? 0) === 0;
              return (
                <div key={entry.id} className="px-4 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[13px] text-white/70">{entry.club?.name ?? "Unknown"}</p>
                      <span className="text-white/20 text-[11px]">&rarr;</span>
                      <p className="text-[13px] text-white/50">{entry.competition?.name} <span className="text-white/25">{entry.competition?.edition}</span></p>
                      {isFree && <span className="text-[9px] text-white/25 uppercase tracking-widest border border-white/10 px-1.5 py-0.5">Free</span>}
                    </div>
                    {payment && !isFree && (
                      <p className="text-[11px] text-white/25 font-mono mt-0.5">{payment.paystack_reference}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-success shrink-0">Paid</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No competition entries yet.</p>
        </div>
      )}
    </div>
  );
}
