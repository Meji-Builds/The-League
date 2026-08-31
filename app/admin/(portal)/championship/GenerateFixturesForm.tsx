"use client";

import { useActionState, useState } from "react";
import { generateChampionshipFixtures, GenerateState } from "./actions";
import Link from "next/link";

interface Competition { id: string; name: string; }

interface Props {
  season:         string;
  confirmedCount: number;
  competitions:   Competition[];
}

export function GenerateFixturesForm({ season, confirmedCount, competitions }: Props) {
  const [state, action, pending] = useActionState<GenerateState, FormData>(generateChampionshipFixtures, null);
  const [format, setFormat] = useState("roundrobin");

  if (confirmedCount < 2) return null;

  const success = state !== null && "success" in state && state.success;

  return (
    <div className="mt-10 border border-cobalt/20 bg-cobalt/[0.03] p-6">
      <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-cobalt mb-1">
        Generate Championship Fixtures
      </p>
      <p className="text-[11px] text-white/40 mb-5">
        {confirmedCount} teams confirmed — choose a format and competition to create the fixtures.
      </p>

      {success ? (
        <div className="space-y-3">
          <p className="text-sm text-success font-semibold">
            {(state as { success: true; count: number }).count} fixture{(state as { success: true; count: number }).count !== 1 ? "s" : ""} generated successfully.
          </p>
          <Link
            href="/admin/fixtures"
            className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 bg-cobalt text-white hover:brightness-110 transition-all"
          >
            View fixtures →
          </Link>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="season" value={season} />

          {/* Competition */}
          <div>
            <label className="block text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-1.5">
              Competition
            </label>
            {competitions.length === 0 ? (
              <p className="text-[11px] text-danger/70">
                No competitions found.{" "}
                <Link href="/admin/competitions" className="underline text-cobalt">Create one first.</Link>
              </p>
            ) : (
              <select
                name="competition_id"
                required
                defaultValue=""
                className="w-full bg-navy border border-white/10 text-white text-xs px-3 py-2 outline-none focus:border-cobalt [&>option]:bg-navy"
              >
                <option value="" disabled>— Select competition —</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Format */}
          <div>
            <label className="block text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-1.5">
              Format
            </label>
            <select
              name="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-navy border border-white/10 text-white text-xs px-3 py-2 outline-none focus:border-cobalt [&>option]:bg-navy"
            >
              <option value="roundrobin">Round-robin — all teams play each other once</option>
              <option value="knockout">Knockout bracket — seeded (1 vs last, 2 vs second-last…)</option>
              <option value="groups">Groups — split into mini-leagues</option>
            </select>
          </div>

          {/* Groups count */}
          {format === "groups" && (
            <div>
              <label className="block text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-1.5">
                Number of groups
              </label>
              <select
                name="num_groups"
                defaultValue="2"
                className="w-full bg-navy border border-white/10 text-white text-xs px-3 py-2 outline-none focus:border-cobalt [&>option]:bg-navy"
              >
                <option value="2">2 groups</option>
                <option value="3">3 groups</option>
                <option value="4">4 groups</option>
              </select>
            </div>
          )}

          {state !== null && "error" in state && (
            <p className="text-[11px] text-danger">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending || competitions.length === 0}
            className="w-full text-[11px] font-black uppercase tracking-[0.2em] px-4 py-2.5 bg-cobalt text-white hover:brightness-110 transition-all disabled:opacity-40"
          >
            {pending ? "Generating…" : `Generate fixtures for ${confirmedCount} teams`}
          </button>
        </form>
      )}
    </div>
  );
}
