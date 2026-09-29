import type { Side } from "./types";

/** "Maria Lopez" in singles, "Maria Lopez / Joan Walsh" for a doubles team. */
export function entryName(entry: Pick<Side, "name" | "partner">) {
  return entry.partner ? `${entry.name} / ${entry.partner}` : (entry.name ?? "");
}

/** "player" / "players" in singles, "team" / "teams" in doubles. */
export function entryWord(kind: string, count: number) {
  const word = kind === "doubles" ? "team" : "player";
  return count === 1 ? word : `${word}s`;
}
