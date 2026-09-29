// Rebuilds a draw tree from a flat list of pro matches.
// Providers report matches per round but not their draw position, so we work backwards
// from the final: a match's two players each came from one match in the round before.
import type { MatchOutcome, MatchStatus, SetScore, Side, ViewMatch, ViewRound } from "../types";
import { roundName } from "../bracket";

export type RawPlayer = Side & { key: string };

export type RawMatch = {
  id: string;
  /** Matches in this round of a full draw: 64, 32, … 2, 1 */
  roundSize: number;
  players: [RawPlayer | null, RawPlayer | null];
  winner: 0 | 1 | null;
  sets: SetScore[];
  status: MatchStatus;
  outcome: MatchOutcome;
  note?: string | null;
  sortKey: string; // date + time, used when order is unknown
};

const tbd = (): Side => ({ name: null });

export function assembleDraw(matches: RawMatch[]): ViewRound[] {
  if (!matches.length) return [];
  const largest = Math.max(...matches.map((m) => m.roundSize));
  const sizes: number[] = [];
  for (let s = largest; s >= 1; s /= 2) sizes.push(s);

  const pool = sizes.map((size) =>
    matches.filter((m) => m.roundSize === size).sort((a, b) => a.sortKey.localeCompare(b.sortKey)),
  );
  const slots: (RawMatch | ViewMatch | null)[][] = sizes.map((size) => Array(size).fill(null));

  // Final (or the latest round we have) goes in as-is.
  const last = sizes.length - 1;
  pool[last].slice(0, 1).forEach((m, i) => (slots[last][i] = m));

  for (let k = last - 1; k >= 0; k--) {
    const unplaced = new Set(pool[k]);
    const later = slots[k + 1];

    // 1. Follow each known player back to the match they came from.
    later.forEach((m, j) => {
      if (!m || !isRaw(m)) return;
      m.players.forEach((p, side) => {
        if (!p) return;
        const feeder = [...unplaced].find((c) => c.players.some((cp) => cp?.key === p.key));
        if (feeder) {
          slots[k][j * 2 + side] = feeder;
          unplaced.delete(feeder);
        } else if (k === 0) {
          // Nothing to follow in the first round: this player had a bye.
          slots[k][j * 2 + side] = byeFor(p);
        }
      });
    });

    // 2. Matches we could not link (not yet decided) fill the remaining gaps in play order.
    const rest = [...unplaced];
    slots[k].forEach((m, i) => {
      if (!m && rest.length) slots[k][i] = rest.shift()!;
    });
  }

  // Forward pass: empty slots show who is through so far, e.g. "Sinner vs To be decided".
  return sizes.map((size, k) => ({
    name: roundName(size),
    matches: slots[k].map((m, j) => {
      if (m) return isRaw(m) ? toView(m) : m;
      const from = (i: number): Side => {
        const f = k > 0 ? slots[k - 1][i] : null;
        if (!f || f.winner == null) return tbd();
        const p = f.players[f.winner];
        return p ? stripKey(p) : tbd();
      };
      const placeholder: ViewMatch = {
        id: `slot-${k}-${j}`,
        players: [from(j * 2), from(j * 2 + 1)],
        winner: null,
        sets: [],
        status: "pending",
        outcome: "normal",
      };
      slots[k][j] = placeholder;
      return placeholder;
    }),
  }));
}

function isRaw(m: RawMatch | ViewMatch): m is RawMatch {
  return "roundSize" in m;
}

function stripKey(p: Side): Side {
  return { name: p.name, partner: p.partner, seed: p.seed, country: p.country };
}

function byeFor(p: RawPlayer): ViewMatch {
  return {
    id: `bye-${p.key}`,
    players: [stripKey(p), { name: null, bye: true }],
    winner: 0,
    sets: [],
    status: "finished",
    outcome: "bye",
  };
}

function toView(m: RawMatch): ViewMatch {
  return {
    id: m.id,
    players: [m.players[0] ? stripKey(m.players[0]) : tbd(), m.players[1] ? stripKey(m.players[1]) : tbd()],
    winner: m.winner,
    sets: m.sets,
    status: m.status,
    outcome: m.outcome,
    note: m.note,
  };
}

export function currentRoundName(rounds: ViewRound[]) {
  const open = rounds.find((r) => r.matches.some((m) => m.status !== "finished" && m.players.some((p) => p.name)));
  return (open ?? rounds.at(-1))?.name ?? null;
}
