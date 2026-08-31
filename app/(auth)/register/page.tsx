"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {

  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [phone, setPhone]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [emailSent, setEmailSent]   = useState(false);

  async function handleEmailRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard/onboarding`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If Supabase requires email confirmation, the session won't exist yet.
    // Show the confirmation message. If email confirmation is disabled,
    // the session exists immediately and we redirect to onboarding.
    if (data.session) {
      window.location.href = "/dashboard/onboarding";
    } else {
      setEmailSent(true);
      setLoading(false);
    }
  }

  async function signUpWithGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard/onboarding`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4 rounded">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className="text-white font-bold text-lg mb-2">Check your email</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          We sent a confirmation link to <span className="text-white">{email}</span>.
          Click it to activate your account and continue setting up your club.
        </p>
        <Link href="/login" className="mt-6 inline-block text-gold text-sm hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-white text-2xl font-bold mb-1">Register Your Club</h1>
      <p className="text-white/50 text-sm mb-8">
        Create your account first. You will set up your club profile and pay
        the registration fee in the next step.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm px-4 py-3 mb-6 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailRegister} className="space-y-4 mb-6">
        <div>
          <label htmlFor="name" className="block text-white/70 text-xs font-medium mb-1.5">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Your full name"
            className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 rounded placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-white/70 text-xs font-medium mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@university.edu"
            className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 rounded placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-white/70 text-xs font-medium mb-1.5">
            Phone <span className="text-white/30 font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+234 800 000 0000"
            className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 rounded placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-white/70 text-xs font-medium mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 rounded placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-white/70 text-xs font-medium mb-1.5">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 rounded placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-navy font-semibold text-sm px-4 py-2.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 border-t border-white/10" />
        <span className="text-white/30 text-xs">or</span>
        <div className="flex-1 border-t border-white/10" />
      </div>

      <button
        onClick={signUpWithGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/15 text-white font-medium text-sm px-4 py-2.5 rounded hover:bg-white/10 transition-colors disabled:opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p className="text-white/30 text-xs text-center mt-6">
        Already registered?{" "}
        <Link href="/login" className="text-gold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
