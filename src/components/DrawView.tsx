"use client";

import { useState } from "react";
import type { ViewRound } from "@/lib/types";
import { MatchCard } from "./MatchCard";
import { entryName } from "@/lib/names";

type Props = {
  rounds: ViewRound[];
  /** Round shown first; defaults to the one being played. */
  initialRound?: number;
  /** Just the bracket, without the round buttons (small sample draws). */
  bare?: boolean;
};

/**
 * The draw. Round buttons choose where the bracket starts.
 * Wide screens show every round from there to the champion. Phones show the same bracket as
 * columns you swipe through, with the next round peeking in so you can see where winners go.
 */
export function DrawView({ rounds, initialRound, bare = false }: Props) {
  const [start, setStart] = useState(() => initialRound ?? defaultStart(rounds));
  if (!rounds.length) return null;

  const shown = rounds.slice(start);
  const final = rounds.at(-1)!.matches[0];
  const champion = final?.winner != null ? final.players[final.winner] : null;
  // Doubles cards carry two names per side, so their rounds get more room.
  const isDoubles = rounds.some((r) => r.matches.some((m) => m.players.some((p) => p.partner)));

  const bracket = (
    // Remounting on a new start round resets the sideways scroll to that round.
    <div key={start} className={`bracket ${isDoubles ? "is-doubles" : ""}`} role="list" aria-label="Draw">
      {shown.map((round, k) => {
        const isLast = start + k === rounds.length - 1;
        const pairs = chunk(round.matches, 2);
        return (
          <div key={round.name} className="bracket-round" role="listitem">
            <RoundHeading>{round.name}</RoundHeading>
            <div className="bracket-round-body">
              {pairs.map((pair) => (
                <div
                  key={pair[0].id}
                  className={[
                    "bracket-pair",
                    pair.length === 2 ? "is-joined" : "is-single",
                    !isLast || champion ? "has-next" : "",
                  ].join(" ")}
                >
                  {pair.map((m) => (
                    <div key={m.id} className="bracket-slot">
                      <MatchCard match={m} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {champion?.name && (
        <div className="bracket-champion flex flex-col">
          <RoundHeading>Champion</RoundHeading>
          <div className="flex flex-1 items-center">
            <p className="display pl-2 text-[1.7rem] whitespace-nowrap">
              <span className="highlight">{entryName(champion)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const swipeHint = shown.length > 1 && (
    <p className="mb-5 font-mono text-xs text-muted lowercase md:hidden">
      swipe sideways to follow the draw{bare ? "" : ", or tap a round to start there"}
    </p>
  );

  if (bare)
    return (
      <>
        {swipeHint}
        {bracket}
      </>
    );

  return (
    <div>
      {rounds.length > 1 && (
        <nav aria-label="Rounds" className="mb-10 flex flex-wrap gap-2">
          {rounds.map((r, i) => (
            <button
              key={r.name}
              type="button"
              onClick={() => setStart(i)}
              aria-pressed={i === start}
              className={`min-h-11 rounded-full border px-5 text-[0.95rem] transition-colors ${
                i === start
                  ? "border-ink bg-ink text-paper-light"
                  : "border-line-strong text-ink-soft hover:border-ink hover:text-ink"
              }`}
            >
              {r.name}
            </button>
          ))}
        </nav>
      )}

      {swipeHint}

      {bracket}
    </div>
  );
}

function RoundHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="eyebrow mb-2">{children}</h3>;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Start at the round in play, but keep at most four rounds on screen for big draws. */
function defaultStart(rounds: ViewRound[]) {
  const playing = rounds.findIndex((r) =>
    r.matches.some((m) => m.status !== "finished" && m.outcome !== "bye" && m.players.some((p) => p.name)),
  );
  const current = playing === -1 ? rounds.length - 1 : playing;
  if (rounds.length <= 4) return 0;
  return Math.max(0, Math.min(current, rounds.length - 4));
}
