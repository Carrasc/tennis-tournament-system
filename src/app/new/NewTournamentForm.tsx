"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createTournament } from "@/app/actions";
import { CopyButton } from "@/components/CopyButton";
import { keepValues } from "@/lib/keep-values";

export function NewTournamentForm() {
  const [state, action, pending] = useActionState(createTournament, undefined);
  const [kind, setKind] = useState("singles");

  if (state?.created) {
    const { publicCode, editCode, name } = state.created;
    return (
      <div>
        <h1 className="display text-[2.6rem] leading-[1.08] text-balance sm:text-[3.4rem]">{name} is ready</h1>
        <p className="mt-3 text-lg text-ink-soft">Write these two codes down. You will need them later.</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <CodeTicket
            title="Organiser code"
            code={editCode}
            note="Keep this one to yourself. It lets you add players, make the draw and enter results from any device."
          />
          <CodeTicket
            title="Draw code"
            code={publicCode}
            note="Share this with players and friends. They can follow the draw but can’t change anything."
          />
        </div>

        <Link href={`/t/${publicCode}/manage`} className="btn btn-primary mt-10">
          Continue to my tournament
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={keepValues(action)} className="card space-y-6 px-5 py-7 sm:px-9 sm:py-9">
      <h1 className="display text-[2.6rem] leading-[1.08] text-balance sm:text-[3.4rem]">New tournament</h1>

      <div>
        <label htmlFor="name" className="label">
          Tournament name
        </label>
        <input id="name" name="name" required className="field" placeholder="Club Championship 2026" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="location" className="label">
            Where <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="location" name="location" className="field" placeholder="Riverside Tennis Club" />
        </div>
        <div>
          <label htmlFor="startDate" className="label">
            Starts on <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="startDate" name="startDate" type="date" className="field" />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <fieldset>
          <legend className="label">Played as</legend>
          <div className="flex flex-wrap gap-3">
            <Option name="kind" value="singles" label="Singles" checked={kind === "singles"} onChange={setKind} />
            <Option name="kind" value="doubles" label="Doubles" checked={kind === "doubles"} onChange={setKind} />
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Matches are</legend>
          <div className="flex flex-wrap gap-3">
            <Option name="format" value="3" label="Best of 3 sets" defaultChecked />
            <Option name="format" value="5" label="Best of 5 sets" />
          </div>
        </fieldset>
      </div>

      <div>
        <label htmlFor="players" className="label">
          {kind === "doubles" ? "Teams" : "Players"}{" "}
          <span className="font-normal text-muted">(optional, you can add them later)</span>
        </label>
        <textarea
          id="players"
          name="players"
          rows={8}
          className="field leading-8"
          placeholder={
            kind === "doubles"
              ? "One team per line, partners split by /\nMaria Lopez / Joan Walsh\nAna Petrova / Ruth Okafor"
              : "One name per line\nMaria Lopez\nJoan Walsh"
          }
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-danger">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Creating…" : "Create tournament"}
      </button>
    </form>
  );
}

/** A pill-shaped radio choice. Controlled when `onChange` is given. */
export function Option(props: {
  name: string;
  value: string;
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (value: string) => void;
}) {
  const control = props.onChange
    ? { checked: props.checked, onChange: () => props.onChange!(props.value) }
    : { defaultChecked: props.defaultChecked };
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full border border-line-strong bg-paper-light px-5 transition-colors has-checked:border-ink has-checked:bg-mist has-checked:font-medium">
      <input type="radio" name={props.name} value={props.value} {...control} className="size-5 accent-ink" />
      {props.label}
    </label>
  );
}

/** A code on a card: what it is for above the tear line, the code itself below. */
function CodeTicket({ title, code, note }: { title: string; code: string; note: string }) {
  return (
    <div className="card flex flex-col">
      <div className="px-5 pt-4 pb-3">
        <p className="font-medium">{title}</p>
        <p className="hint mt-1">{note}</p>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line-strong px-5 py-4">
        <span className="font-mono text-[1.7rem] leading-none tracking-[0.12em]">{code}</span>
        <CopyButton value={code} />
      </div>
    </div>
  );
}
