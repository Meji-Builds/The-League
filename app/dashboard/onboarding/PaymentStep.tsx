"use client";

import { useActionState } from "react";
import { initiatePayment } from "./actions";

interface Props {
  feeNaira: number;
  clubName: string;
}

export function PaymentStep({ feeNaira, clubName }: Props) {
  const [state, action, isPending] = useActionState(initiatePayment, null);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <span className="text-xs font-semibold text-gold uppercase tracking-widest">Step 2 of 2</span>
        <h2 className="text-navy text-xl font-bold mt-1">Pay registration fee</h2>
        <p className="text-muted text-sm mt-1">
          A one-time fee to register <span className="font-medium text-navy">{clubName}</span> in The League.
        </p>
      </div>

      {state?.error && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-sm px-4 py-3 mb-6 rounded">
          {state.error}
        </div>
      )}

      <div className="border border-border bg-white rounded p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted">Owner registration fee</span>
          <span className="text-sm font-semibold text-navy">
            NGN {feeNaira.toLocaleString()}
          </span>
        </div>
        <div className="border-t border-border pt-3 mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-navy">Total</span>
          <span className="text-lg font-bold text-navy">
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
          {isPending ? "Redirecting to payment..." : "Pay now"}
        </button>
      </form>

      <p className="text-muted text-xs text-center mt-4">
        Payments are processed securely by Paystack. You will be redirected back after payment.
      </p>
    </div>
  );
}
