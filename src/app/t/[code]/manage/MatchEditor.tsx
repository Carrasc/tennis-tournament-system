"use client";

import { useActionState, useState } from "react";
import { clearResult, saveMatch } from "@/app/actions";
import { MatchCard } from "@/components/MatchCard";
import type { ViewMatch } from "@/lib/types";
import { entryName } from "@/lib/names";
import { keepValues } from "@/lib/keep-values";

type Props = { tournamentId: string; match: ViewMatch; setsToWin: number };

export function MatchEditor({ tournamentId, match, setsToWin }: Props) {
  const ready = match.players.every((p) => p.name);
  const [open, setOpen] = useState(false);

  if (match.status === "finished") {
    return <FinishedMatch tournamentId={tournamentId} match={match} />;
  }

  if (!ready) {
    return (
      <div className="max-w-md opacity-70">
        <MatchCard match={match} inList />
        <p className="hint mt-1">Waiting for the earlier match to finish.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-64 flex-1">
          <MatchCard match={match} inList />
        </div>
        {!open && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            Enter result
          </button>
        )}
      </div>
      {open && (
        <ResultForm tournamentId={tournamentId} match={match} setsToWin={setsToWin} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

function FinishedMatch({ tournamentId, match }: { tournamentId: string; match: ViewMatch }) {
  const [state, action, pending] = useActionState(clearResult.bind(null, tournamentId, match.id), undefined);
  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-64 flex-1">
          <MatchCard match={match} inList />
        </div>
        <form action={action}>
          <button className="btn btn-quiet" disabled={pending}>
            {pending ? "Clearing…" : "Clear result"}
          </button>
        </form>
      </div>
      {state?.error && (
        <p role="alert" className="mt-2 text-danger">
          {state.error}
        </p>
      )}
    </div>
  );
}

function ResultForm({ tournamentId, match, setsToWin, onClose }: Props & { onClose: () => void }) {
  const [state, action, pending] = useActionState(saveMatch.bind(null, tournamentId, match.id), undefined);
  const [status, setStatus] = useState(match.status === "live" ? "live" : "finished");
  const [outcome, setOutcome] = useState("normal");
  const maxSets = setsToWin * 2 - 1;
  const names = match.players.map((p) => (p.name ? entryName(p) : ""));

  return (
    <form
      onSubmit={keepValues(action)}
      className="mt-4 space-y-6 rounded-md bg-paper p-5">
      <fieldset>
        <legend className="label">What&apos;s happening?</legend>
        <div className="flex flex-wrap gap-2">
          {[
            ["pending", "Not started"],
            ["live", "Playing now"],
            ["finished", "Finished"],
          ].map(([value, label]) => (
            <Choice key={value} name="status" value={value} label={label} checked={status === value} onChange={setStatus} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">
          Score <span className="font-normal text-muted">(games in each set)</span>
        </legend>
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-x-2 border-spacing-y-1">
            <thead>
              <tr className="text-sm text-muted">
                <th className="text-left font-normal">
                  <span className="sr-only">Player</span>
                </th>
                {Array.from({ length: maxSets }, (_, s) => (
                  <th key={s} className="font-normal">
                    Set {s + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["a", "b"] as const).map((side, i) => (
                <tr key={side}>
                  <th scope="row" className="max-w-48 pr-2 text-left leading-snug font-medium">
                    <span className="block truncate">{match.players[i].name}</span>
                    {match.players[i].partner && <span className="block truncate">{match.players[i].partner}</span>}
                  </th>
                  {Array.from({ length: maxSets }, (_, s) => (
                    <td key={s}>
                      <input
                        name={`${side}${s}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={99}
                        defaultValue={match.sets[s]?.[side] ?? ""}
                        aria-label={`${names[i]}, set ${s + 1}`}
                        className="field w-16 text-center text-lg"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className="pr-2 text-left text-sm font-normal text-muted">
                  Tiebreak <span className="block">(optional)</span>
                </th>
                {Array.from({ length: maxSets }, (_, s) => (
                  <td key={s}>
                    <input
                      name={`tb${s}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={99}
                      defaultValue={match.sets[s]?.tb ?? ""}
                      aria-label={`Tiebreak points of the player who lost set ${s + 1}`}
                      className="field min-h-10 w-16 text-center text-sm"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="hint mt-1">For a 7-6 set, the tiebreak box is the points of the player who lost it, e.g. 7-6(5).</p>
      </fieldset>

      {status === "finished" && (
        <fieldset>
          <legend className="label">How did it end?</legend>
          <div className="flex flex-wrap gap-2">
            {[
              ["normal", "Played to the end"],
              ["retired", "A player retired"],
              ["walkover", "Walkover (not played)"],
            ].map(([value, label]) => (
              <Choice key={value} name="outcome" value={value} label={label} checked={outcome === value} onChange={setOutcome} />
            ))}
          </div>
          {outcome !== "normal" && (
            <div className="mt-4">
              <p className="label">Who goes through?</p>
              <div className="flex flex-wrap gap-2">
                {names.map((n, i) => (
                  <Choice key={i} name="winner" value={String(i)} label={n} />
                ))}
              </div>
            </div>
          )}
        </fieldset>
      )}

      <div>
        <label htmlFor={`note-${match.id}`} className="label">
          Court or time <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id={`note-${match.id}`}
          name="note"
          defaultValue={match.note ?? ""}
          placeholder="Court 2, 10:30"
          className="field max-w-sm"
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-live">
          {state.ok}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : status === "finished" ? "Save result" : "Save"}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          Close
        </button>
      </div>
    </form>
  );
}

function Choice(props: {
  name: string;
  value: string;
  label: string;
  checked?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full border border-line-strong bg-paper-light px-5 transition-colors has-checked:border-ink has-checked:bg-mist has-checked:font-medium">
      <input
        type="radio"
        name={props.name}
        value={props.value}
        required={props.name === "winner"}
        {...(props.onChange
          ? { checked: props.checked, onChange: () => props.onChange!(props.value) }
          : {})}
        className="size-5 accent-ink"
      />
      {props.label}
    </label>
  );
}
