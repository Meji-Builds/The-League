"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function AdminLoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Invalid credentials.");
      setLoading(false);
      return;
    }

    // Verify admin role from app_metadata before granting access.
    if (data.user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("Access denied. This portal is for admins only.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-gold font-bold tracking-widest uppercase text-sm mb-6">The League</p>
          <h1 className="text-white text-2xl font-bold mb-1">Admin portal</h1>
          <p className="text-white/40 text-sm">Restricted access. League Office only.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 mb-6 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-white/50 text-xs font-medium mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@theleague.com"
              className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 rounded placeholder:text-white/20 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-white/50 text-xs font-medium mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 rounded placeholder:text-white/20 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-navy font-semibold text-sm px-4 py-2.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
