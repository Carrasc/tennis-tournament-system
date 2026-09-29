"use client";

import { useActionState } from "react";
import { openWithCode } from "@/app/actions";

export function CodeForm() {
  const [state, action, pending] = useActionState(openWithCode, undefined);
  return (
    <form action={action}>
      <label htmlFor="code" className="sr-only">
        Tournament code
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="code"
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="e.g. K7Q2MX"
          aria-describedby={state?.error ? "code-error" : undefined}
          className="field max-w-64 flex-1 font-mono text-lg tracking-[0.2em] uppercase placeholder:tracking-normal placeholder:normal-case"
        />
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Opening…" : "Open"}
        </button>
      </div>
      {state?.error && (
        <p id="code-error" role="alert" className="mt-2 text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
