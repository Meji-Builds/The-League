"use client";

import { useActionState, useEffect } from "react";
import { initiatePayment } from "./actions";

interface Props {
  feeNaira: number;
  clubName: string;
}

export function PaymentStep({ feeNaira, clubName }: Props) {
  const [state, action, isPending] = useActionState(initiatePayment, null);

  useEffect(() => {
    if (state && "redirect" in state) {
      window.location.href = state.redirect;
    }
  }, [state]);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <span className="text-xs font-semibold text-gold uppercase tracking-widest">Step 2 of 2</span>
        <h2 className="text-white text-xl font-bold mt-1">Pay registration fee</h2>
        <p className="text-white/40 text-sm mt-1">
          A one-time fee to register <span className="font-medium text-white">{clubName}</span> in The League.
        </p>
      </div>

      {state && "error" in state && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-sm px-4 py-3 mb-6">
          {"error" in state ? state.error : null}
        </div>
      )}

      <div className="border border-white/6 bg-card p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white/40">Owner registration fee</span>
          <span className="text-sm font-semibold text-white">
            NGN {feeNaira.toLocaleString()}
          </span>
        </div>
        <div className="border-t border-white/6 pt-3 mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-white/70">Total</span>
          <span className="text-lg font-bold text-white">
            NGN {feeNaira.toLocaleString()}
          </span>
        </div>
      </div>

      <form action={action}>
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-gold text-navy font-semibold text-sm px-4 py-2.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {isPending ? "Redirecting to payment..." : "Pay with Paystack"}
        </button>
      </form>
    </div>
  );
}
