// Sample draws shown when no API key is configured, so the Pro tours pages can be tried out.
import type { SetScore } from "../types";
import { assembleDraw, currentRoundName, type RawMatch, type RawPlayer } from "./assemble";
import type { ProDraw, ProSource, Tour } from "./types";

const ATP = [
  "J. Sinner", "C. Alcaraz", "A. Zverev", "T. Fritz", "N. Djokovic", "J. Draper", "A. de Minaur", "L. Musetti",
  "H. Rune", "B. Shelton", "D. Medvedev", "C. Ruud", "T. Paul", "F. Cerúndolo", "A. Rublev", "U. Humbert",
  "G. Dimitrov", "T. Machac", "S. Tsitsipas", "J. Mensik", "F. Auger-Aliassime", "A. Fils", "K. Khachanov", "G. Mpetshi Perricard",
  "S. Korda", "B. Nakashima", "A. Popyrin", "J. Lehecka", "D. Shapovalov", "A. Davidovich Fokina", "F. Tiafoe", "H. Hurkacz",
];
const WTA = [
  "A. Sabalenka", "I. Swiatek", "C. Gauff", "J. Pegula", "M. Andreeva", "Q. Zheng", "E. Rybakina", "J. Paolini",
  "M. Keys", "E. Navarro", "P. Badosa", "D. Shnaider", "K. Muchova", "A. Anisimova", "E. Alexandrova", "B. Haddad Maia",
];

// Small deterministic generator so the demo looks the same on every refresh.
function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

function playSets(rand: () => number, topWins: boolean): SetScore[] {
  const sets: SetScore[] = [];
  const threeSets = rand() < 0.35;
  const order = threeSets ? [!topWins, topWins, topWins] : [topWins, topWins];
  for (const top of order) {
    const tiebreak = rand() < 0.2;
    const loserGames = tiebreak ? 6 : Math.floor(rand() * 5);
    const winnerGames = tiebreak ? 7 : loserGames === 5 ? 7 : 6;
    sets.push(
      top
        ? { a: winnerGames, b: loserGames, tb: tiebreak ? Math.floor(rand() * 6) + 1 : null }
        : { a: loserGames, b: winnerGames, tb: tiebreak ? Math.floor(rand() * 6) + 1 : null },
    );
  }
  return sets;
}

/** Plays `roundsDone` rounds, puts `liveInNext` matches of the next round on court. */
/** Entries are in ranking order; a doubles team is written "Name / Partner". */
function demoDraw(id: string, name: string, tour: Tour, names: string[], roundsDone: number, liveInNext: number, seed: number): ProDraw {
  const rand = rng(seed);
  const seedCount = names.length / 4;
  // names are in ranking order; place them with the classic seeding lines
  let lines = [1, 2];
  while (lines.length < names.length) {
    const n = lines.length * 2;
    lines = lines.flatMap((l) => [l, n + 1 - l]);
  }
  let field: RawPlayer[] = lines.map((line) => {
    const [first, partner] = names[line - 1].split(" / ");
    return { key: names[line - 1], name: first, partner: partner ?? null, seed: line <= seedCount ? line : null };
  });

  const matches: RawMatch[] = [];
  const today = new Date().toISOString().slice(0, 10);
  let round = 0;
  while (field.length > 1) {
    const size = field.length / 2;
    const next: RawPlayer[] = [];
    for (let i = 0; i < size; i++) {
      const [p, q] = [field[i * 2], field[i * 2 + 1]];
      const base = { id: `${id}-${round}-${i}`, roundSize: size, players: [p, q] as [RawPlayer, RawPlayer], sortKey: `${round}-${i}` };
      if (round < roundsDone) {
        // favourites usually win
        const topWins = (p.seed ?? 99) < (q.seed ?? 99) ? rand() < 0.75 : rand() < 0.4;
        matches.push({ ...base, winner: topWins ? 0 : 1, sets: playSets(rand, topWins), status: "finished", outcome: "normal" });
        next.push(topWins ? p : q);
      } else if (round === roundsDone) {
        const live = i < liveInNext;
        matches.push({
          ...base,
          winner: null,
          sets: live ? [{ a: 6, b: 4 }, { a: 2, b: 3 }] : [],
          status: live ? "live" : "pending",
          outcome: "normal",
          note: live ? "Centre Court" : "Not before 15:00",
        });
      }
    }
    if (round >= roundsDone) break;
    field = next;
    round++;
  }

  const rounds = assembleDraw(matches);
  return {
    id,
    name,
    tour,
    event: names[0].includes(" / ") ? "doubles" : "singles",
    liveCount: liveInNext,
    currentRound: currentRoundName(rounds),
    firstDay: today,
    lastDay: today,
    rounds,
  };
}

const WTA_DOUBLES = [
  "K. Siniakova / T. Townsend", "E. Mertens / V. Kudermetova", "S. Errani / J. Paolini", "G. Dabrowski / E. Routliffe",
  "C. Dolehide / D. Krawczyk", "S. Hsieh / J. Ostapenko", "L. Kichenok / E. Perez", "A. Danilina / I. Khromacheva",
];

const DRAWS = [
  demoDraw("demo-atp", "Sample ATP 500", "ATP", ATP, 3, 1, 7),
  demoDraw("demo-wta", "Sample WTA 1000", "WTA", WTA, 2, 1, 11),
  demoDraw("demo-wta-doubles", "Sample WTA 1000", "WTA", WTA_DOUBLES, 1, 1, 5),
];

export const demoSource: ProSource = {
  demo: true,
  async list() {
    return DRAWS.map(({ rounds: _rounds, ...summary }) => summary);
  },
  async draw(id) {
    return DRAWS.find((d) => d.id === id) ?? null;
  },
};
