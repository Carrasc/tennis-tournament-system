"use client";

import { useActionState, useRef } from "react";
import { addPlayers, createDraw, setSeed, updateDetails } from "@/app/actions";
import { Option } from "@/app/new/NewTournamentForm";
import { entryWord } from "@/lib/names";
import type { FullTournament } from "@/lib/tournaments";
import { keepValues } from "@/lib/keep-values";

function Message({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (state?.error)
    return (
      <p role="alert" className="mt-3 text-danger">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p role="status" className="mt-3 text-live">
        {state.ok}
      </p>
    );
  return null;
}

export function AddPlayersForm({ tournamentId, kind }: { tournamentId: string; kind: string }) {
  const doubles = kind === "doubles";
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: Parameters<typeof addPlayers>[1], form: FormData) => {
    const result = await addPlayers(tournamentId, prev, form);
    if (result?.ok) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <section aria-labelledby="add-heading" className="card px-5 py-6 sm:px-8">
      <h2 id="add-heading" className="display text-[1.9rem] leading-tight">
        {doubles ? "Add teams" : "Add players"}
      </h2>
      <form ref={formRef} onSubmit={keepValues(action)} className="mt-4">
        <label htmlFor="players" className="label">
          {doubles ? "One team per line, partners split by /" : "Names, one per line"}
        </label>
        <textarea
          id="players"
          name="players"
          rows={5}
          className="field leading-8"
          placeholder={doubles ? "Maria Lopez / Joan Walsh\nAna Petrova / Ruth Okafor" : "Maria Lopez\nJoan Walsh"}
        />
        <button type="submit" className="btn btn-primary mt-3" disabled={pending}>
          {pending ? "Adding…" : doubles ? "Add teams" : "Add players"}
        </button>
        <Message state={state} />
      </form>
    </section>
  );
}

export function DetailsForm({ tournament: t }: { tournament: FullTournament }) {
  const [state, action, pending] = useActionState(updateDetails.bind(null, t.id), undefined);
  return (
    <section aria-labelledby="details-heading" className="card self-start px-5 py-6 sm:px-8">
      <h2 id="details-heading" className="display text-[1.9rem] leading-tight">
        Tournament details
      </h2>
      <form onSubmit={keepValues(action)} className="mt-4 space-y-5">
        <div>
          <label htmlFor="d-name" className="label">
            Name
          </label>
          <input id="d-name" name="name" required defaultValue={t.name} className="field" />
        </div>
        <div>
          <label htmlFor="d-location" className="label">
            Where
          </label>
          <input id="d-location" name="location" defaultValue={t.location ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="d-date" className="label">
            Starts on
          </label>
          <input
            id="d-date"
            name="startDate"
            type="date"
            defaultValue={t.startDate ? t.startDate.toISOString().slice(0, 10) : ""}
            className="field"
          />
        </div>
        <fieldset>
          <legend className="label">Matches are</legend>
          <div className="flex flex-wrap gap-3">
            <Option name="format" value="3" label="Best of 3 sets" defaultChecked={t.setsToWin === 2} />
            <Option name="format" value="5" label="Best of 5 sets" defaultChecked={t.setsToWin === 3} />
          </div>
        </fieldset>
        {/* Singles or doubles can only change before the draw is made. */}
        {t.status === "setup" && (
          <fieldset>
            <legend className="label">Played as</legend>
            <div className="flex flex-wrap gap-3">
              <Option name="kind" value="singles" label="Singles" defaultChecked={t.kind !== "doubles"} />
              <Option name="kind" value="doubles" label="Doubles" defaultChecked={t.kind === "doubles"} />
            </div>
          </fieldset>
        )}
        <button type="submit" className="btn btn-secondary" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </button>
        <Message state={state} />
      </form>
    </section>
  );
}

export function SeedSelect(props: {
  tournamentId: string;
  participantId: string;
  seed: number | null;
  max: number;
  playerName: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={setSeed.bind(null, props.tournamentId, props.participantId)}>
      <label className="sr-only" htmlFor={`seed-${props.participantId}`}>
        Seed for {props.playerName}
      </label>
      <select
        id={`seed-${props.participantId}`}
        name="seed"
        defaultValue={props.seed ?? ""}
        key={props.seed ?? "none"}
        onChange={() => formRef.current?.requestSubmit()}
        className="field min-h-11 w-auto py-1"
      >
        <option value="">No seed</option>
        {Array.from({ length: props.max }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            Seed {i + 1}
          </option>
        ))}
      </select>
    </form>
  );
}

export function MakeDrawButton({ tournamentId, kind, playerCount }: { tournamentId: string; kind: string; playerCount: number }) {
  const [state, action, pending] = useActionState(createDraw.bind(null, tournamentId), undefined);
  return (
    <form action={action} className="rounded-md bg-paper p-5">
      <h3 className="text-xl font-medium">Ready? Make the draw</h3>
      <p className="mt-1 mb-4 text-ink-soft">
        Seeds are kept apart. Everyone else is placed at random. You can go back and redo it until the first result
        is in.
      </p>
      <button type="submit" className="btn btn-primary" disabled={pending || playerCount < 2}>
        {pending ? "Making the draw…" : "Make the draw"}
      </button>
      {playerCount < 2 && <p className="hint mt-2">Add at least 2 {entryWord(kind, 2)} first.</p>}
      <Message state={state} />
    </form>
  );
}
