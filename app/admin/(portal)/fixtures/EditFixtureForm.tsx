"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { updateFixture, deleteFixture } from "./actions";

interface Club         { id: string; name: string; faculty: string }
interface Competition  { id: string; name: string; edition: string; faculty_id: string | null }
interface Division     { id: string; name: string; faculty_id: string }
interface DivisionClub { division_id: string; club_id: string }

interface Props {
  fixture: {
    id:             string;
    stage:          string;
    group_name:     string;
    matchday:       number;
    status:         string;
    scheduled_at:   string | null;
    competition_id: string;
    club_a:         { id: string; name: string } | null;
    club_b:         { id: string; name: string } | null;
  };
  clubs:         Club[];
  competitions:  Competition[];
  divisions:     Division[];
  divisionClubs: DivisionClub[];
}

const STAGES = ["N/A", "Department", "Faculty", "University"];

export function EditFixtureForm({ fixture, clubs, competitions, divisions, divisionClubs }: Props) {
  const [open,          setOpen]          = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState(fixture.competition_id);

  const selectedComp = useMemo(
    () => competitions.find((c) => c.id === selectedCompId) ?? null,
    [competitions, selectedCompId],
  );

  const filteredDivisions = useMemo(() => {
    if (!selectedComp?.faculty_id) return [];
    return divisions.filter((d) => d.faculty_id === selectedComp.faculty_id);
  }, [divisions, selectedComp]);

  const eligibleClubIds = useMemo(() => {
    if (!selectedComp?.faculty_id) return null;
    const divIds = new Set(filteredDivisions.map((d) => d.id));
    return new Set(divisionClubs.filter((dc) => divIds.has(dc.division_id)).map((dc) => dc.club_id));
  }, [filteredDivisions, divisionClubs, selectedComp]);

  const filteredClubs = useMemo(
    () => (eligibleClubIds ? clubs.filter((c) => eligibleClubIds.has(c.id)) : clubs),
    [clubs, eligibleClubIds],
  );

  const [updateState, updateAction, isUpdating] = useActionState(updateFixture, null);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteFixture, null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && !isUpdating && updateState === null) {
      setOpen(false);
      submitted.current = false;
    }
  }, [isUpdating, updateState]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-3 py-1 rounded border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors"
      >
        Edit
      </button>
    );
  }

  const scheduledValue = fixture.scheduled_at
    ? new Date(fixture.scheduled_at).toISOString().slice(0, 16)
    : "";

  return (
    <div className="mt-3 pt-3 border-t border-white/6 space-y-3">
      {/* ── Update form ── */}
      <form
        action={updateAction}
        onSubmit={() => { submitted.current = true; }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <input type="hidden" name="fixture_id" value={fixture.id} />

        {updateState?.error && (
          <p className="sm:col-span-2 lg:col-span-3 text-xs text-danger">{updateState.error}</p>
        )}

        {/* Competition */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Competition</label>
          <select
            name="competition_id"
            value={selectedCompId}
            onChange={(e) => setSelectedCompId(e.target.value)}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.edition}</option>
            ))}
          </select>
        </div>

        {/* Division */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Division</label>
          <select
            name="division_id"
            defaultValue=""
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="">No division / Open</option>
            {filteredDivisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Club A */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Club A (home)</label>
          <select
            name="club_a_id"
            defaultValue={fixture.club_a?.id ?? ""}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="">— select —</option>
            {filteredClubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Club B */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Club B (away)</label>
          <select
            name="club_b_id"
            defaultValue={fixture.club_b?.id ?? ""}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="">— select —</option>
            {filteredClubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stage */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Stage</label>
          <select
            name="stage"
            defaultValue={fixture.stage}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Matchday */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Matchday</label>
          <input
            name="matchday"
            type="number"
            min="1"
            defaultValue={fixture.matchday}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        {/* Scheduled date */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Date &amp; time</label>
          <input
            name="scheduled_at"
            type="datetime-local"
            defaultValue={scheduledValue}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Status</label>
          <select
            name="status"
            defaultValue={fixture.status}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="scheduled">Scheduled</option>
            <option value="reported">Reported</option>
            <option value="disputed">Disputed</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>

        {/* Save / Cancel */}
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-gold text-navy font-semibold text-xs px-4 py-1.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
          >
            {isUpdating ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setConfirmDelete(false); }}
            className="text-xs font-semibold px-4 py-1.5 rounded border border-white/10 text-white/50 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* ── Delete form — kept as a separate sibling, never nested ── */}
      <div className="pt-2 border-t border-white/6 flex items-center gap-2 flex-wrap">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors"
          >
            Delete fixture
          </button>
        ) : (
          <>
            <span className="text-xs text-white/50">Delete this fixture permanently?</span>
            {deleteState?.error && (
              <span className="text-xs text-danger">{deleteState.error}</span>
            )}
            <form action={deleteAction} className="flex items-center gap-1.5">
              <input type="hidden" name="fixture_id" value={fixture.id} />
              <button
                type="submit"
                disabled={isDeleting}
                className="text-xs font-bold px-3 py-1.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition-colors disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs font-semibold px-3 py-1.5 rounded border border-white/10 text-white/40 hover:text-white transition-colors"
              >
                No
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
