// Pure draw logic for single-elimination tournaments. No database access here.
import type { SetScore } from "./types";

export function nextPowerOfTwo(n: number) {
  let size = 2;
  while (size < n) size *= 2;
  return size;
}

/**
 * Standard tennis draw order. Element i is the "line" (1 = strongest) placed in slot i,
 * so seed 1 is at the top, seed 2 at the bottom, and they can only meet in the final.
 * For 8: [1, 8, 4, 5, 6, 3, 7, 2]
 */
export function drawLines(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((line) => [line, n + 1 - line]);
  }
  // Mirror the bottom half so seed 2 sits on the very last line, as on a paper draw sheet.
  const half = size / 2;
  return [...order.slice(0, half), ...order.slice(half).reverse()];
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type DrawPlayer = { id: string; seed: number | null };

/**
 * Places players into draw slots. Returns an array of length `size` with a player id or null (bye).
 * Seeds 1 and 2 have fixed lines; seeds 3–4, 5–8, 9–16… are drawn at random within their group,
 * like on the pro tours. Byes go to the strongest lines first; everyone else is drawn at random.
 */
export function makeDraw(players: DrawPlayer[]): (string | null)[] {
  const size = nextPowerOfTwo(players.length);
  const byes = size - players.length;

  const seeded = players
    .filter((p) => p.seed != null)
    .sort((x, y) => (x.seed as number) - (y.seed as number));
  const unseeded = shuffle(players.filter((p) => p.seed == null));

  const byLine = new Map<number, string | null>();

  // Seeds: group 1, 2, 3–4, 5–8, 9–16 …; within a group lines are shuffled.
  let lo = 1;
  let groupEnd = 1;
  let i = 0;
  while (i < seeded.length) {
    const lines = shuffle(range(lo, groupEnd));
    for (const line of lines) {
      if (i >= seeded.length) break;
      byLine.set(line, seeded[i++].id);
    }
    lo = groupEnd + 1;
    groupEnd = groupEnd === 1 ? 2 : groupEnd * 2;
  }

  // Byes go to seeds in seed order, then to the next strongest lines. Line L faces line size+1-L.
  const seedLines = seeded.map((p) => [...byLine].find(([, id]) => id === p.id)![0]);
  const otherLines = range(1, size / 2).filter((line) => !byLine.has(line));
  for (const line of [...seedLines, ...otherLines].slice(0, byes)) byLine.set(size + 1 - line, null);

  const free = range(1, size).filter((line) => !byLine.has(line));
  free.forEach((line, k) => byLine.set(line, unseeded[k].id));

  return drawLines(size).map((line) => byLine.get(line) ?? null);
}

function range(from: number, to: number) {
  const out: number[] = [];
  for (let n = from; n <= to; n++) out.push(n);
  return out;
}

export function roundName(matchesInRound: number) {
  if (matchesInRound === 1) return "Final";
  if (matchesInRound === 2) return "Semi-finals";
  if (matchesInRound === 4) return "Quarter-finals";
  return `Round of ${matchesInRound * 2}`;
}

/** Returns 0 / 1 when one side has won enough sets, otherwise null. */
export function winnerFromSets(sets: SetScore[], setsToWin: number): 0 | 1 | null {
  let a = 0;
  let b = 0;
  for (const s of sets) {
    if (s.a > s.b) a++;
    else if (s.b > s.a) b++;
  }
  if (a >= setsToWin && a > b) return 0;
  if (b >= setsToWin && b > a) return 1;
  return null;
}

export function parseSets(raw: string | null | undefined): SetScore[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** "6-4 3-6 7-6(5)" with the winner's games first, the way scores are usually read aloud. */
export function scoreText(sets: SetScore[], winner: 0 | 1 | null) {
  return sets
    .map((s) => {
      const [w, l] = winner === 1 ? [s.b, s.a] : [s.a, s.b];
      return `${w}-${l}${s.tb != null ? `(${s.tb})` : ""}`;
    })
    .join("  ");
}
