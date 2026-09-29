import "server-only";
import { db } from "./db";
import { normalizeCode } from "./codes";
import { parseSets, roundName } from "./bracket";
import type { MatchOutcome, MatchStatus, Side, ViewRound } from "./types";

export async function getTournament(publicCode: string) {
  return db.tournament.findUnique({
    where: { publicCode: normalizeCode(publicCode) },
    include: {
      // Keep the order players were added so rows never jump while seeding.
      participants: { orderBy: { createdAt: "asc" } },
      matches: { orderBy: [{ round: "asc" }, { position: "asc" }] },
    },
  });
}

export type FullTournament = NonNullable<Awaited<ReturnType<typeof getTournament>>>;

export function toViewRounds(t: FullTournament): ViewRound[] {
  const people = new Map(t.participants.map((p) => [p.id, p]));
  const side = (id: string | null, isBye: boolean): Side => {
    if (isBye && !id) return { name: null, bye: true };
    const p = id ? people.get(id) : undefined;
    if (!p) return { name: null };
    return { name: p.name, partner: t.kind === "doubles" ? p.partner : null, seed: p.seed };
  };

  const rounds = new Map<number, FullTournament["matches"]>();
  for (const m of t.matches) rounds.set(m.round, [...(rounds.get(m.round) ?? []), m]);

  return [...rounds.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, matches]) => ({
      name: roundName(matches.length),
      matches: matches.map((m) => {
        const isBye = m.outcome === "bye";
        return {
          id: m.id,
          players: [side(m.player1Id, isBye), side(m.player2Id, isBye)] as [Side, Side],
          winner: m.winnerId == null ? null : m.winnerId === m.player1Id ? 0 : 1,
          sets: parseSets(m.score),
          status: m.status as MatchStatus,
          outcome: m.outcome as MatchOutcome,
          note: m.court,
        };
      }),
    }));
}

export function champion(t: FullTournament) {
  const final = t.matches.at(-1);
  if (!final?.winnerId) return null;
  return t.participants.find((p) => p.id === final.winnerId) ?? null;
}
