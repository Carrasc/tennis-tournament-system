// Shape shared by local tournaments and pro draws, so both render with the same bracket.

export type Side = {
  name: string | null; // null = not decided yet
  partner?: string | null; // doubles: the second player of the team
  seed?: number | null;
  country?: string | null;
  bye?: boolean;
};

/** Games won by the top player (a) and bottom player (b). tb = tiebreak points of the set's loser. */
export type SetScore = { a: number; b: number; tb?: number | null };

export type MatchStatus = "pending" | "live" | "finished";
export type MatchOutcome = "normal" | "bye" | "walkover" | "retired";

export type ViewMatch = {
  id: string;
  players: [Side, Side];
  winner: 0 | 1 | null;
  sets: SetScore[];
  status: MatchStatus;
  outcome: MatchOutcome;
  note?: string | null; // court / time, written in the margin
};

export type ViewRound = { name: string; matches: ViewMatch[] };
