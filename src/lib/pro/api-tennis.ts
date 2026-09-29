import "server-only";
import { unstable_cache } from "next/cache";
import type { SetScore } from "../types";
import { assembleDraw, currentRoundName, type RawMatch, type RawPlayer } from "./assemble";
import type { ProDraw, ProEvent, ProSource, ProSummary, Tour } from "./types";

// https://api-tennis.com/documentation — fixtures include live scores while matches are on.
const BASE = "https://api.api-tennis.com/tennis/";

type Fixture = {
  event_key: number | string;
  event_date: string;
  event_time?: string;
  event_first_player: string;
  first_player_key: number | string;
  event_second_player: string;
  second_player_key: number | string;
  event_winner?: "First Player" | "Second Player" | null;
  event_status?: string;
  event_live?: string;
  event_type_type?: string;
  tournament_name: string;
  tournament_key: number | string;
  tournament_round?: string;
  scores?: { score_first: string; score_second: string; score_set: string }[];
};

const EVENTS: Record<string, { tour: Tour; event: ProEvent }> = {
  "Atp Singles": { tour: "ATP", event: "singles" },
  "Wta Singles": { tour: "WTA", event: "singles" },
  "Atp Doubles": { tour: "ATP", event: "doubles" },
  "Wta Doubles": { tour: "WTA", event: "doubles" },
};

// "ATP Shanghai - 1/8-finals" → 8 matches in the round.
function roundSize(label: string | undefined): number | null {
  const part = label?.split(" - ").at(-1)?.trim().toLowerCase() ?? "";
  if (part === "final") return 1;
  const m = part.match(/^1\/(\d+)-finals?$/);
  return m ? Number(m[1]) : null;
}

function isoDay(offsetDays: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// Tiebreak sets can arrive as "7.7" / "6.5": games, then tiebreak points.
function parseSets(scores: Fixture["scores"]): SetScore[] {
  return (scores ?? [])
    .sort((x, y) => Number(x.score_set) - Number(y.score_set))
    .map((s) => {
      const [a, aTb] = s.score_first.split(".");
      const [b, bTb] = s.score_second.split(".");
      const ga = Number(a) || 0;
      const gb = Number(b) || 0;
      const loserTb = ga > gb ? bTb : aTb;
      return { a: ga, b: gb, tb: loserTb != null && loserTb !== "" ? Number(loserTb) : null };
    });
}

function toRaw(f: Fixture): RawMatch | null {
  const size = roundSize(f.tournament_round);
  if (!size) return null; // qualifying and unknown rounds are left out
  const status = (f.event_status ?? "").toLowerCase();
  const finished = f.event_winner != null || ["finished", "retired", "walk over", "walkover"].includes(status);
  // Doubles teams arrive as one string: "Granollers M./Zeballos H."
  const player = (name: string, key: number | string): RawPlayer | null => {
    if (!name) return null;
    const [first, partner] = name.split("/").map((part) => part.trim());
    return { name: first, partner: partner || null, key: String(key) };
  };

  return {
    id: String(f.event_key),
    roundSize: size,
    players: [player(f.event_first_player, f.first_player_key), player(f.event_second_player, f.second_player_key)],
    winner: f.event_winner === "First Player" ? 0 : f.event_winner === "Second Player" ? 1 : null,
    sets: parseSets(f.scores),
    status: f.event_live === "1" ? "live" : finished ? "finished" : "pending",
    outcome: status.includes("walk") ? "walkover" : status.includes("retired") ? "retired" : "normal",
    note: finished ? null : [f.event_date, f.event_time].filter(Boolean).join(" "),
    sortKey: `${f.event_date} ${f.event_time ?? ""}`,
  };
}

type Group = { summary: ProSummary; matches: RawMatch[] };

async function fetchGroups(): Promise<Group[]> {
  const key = process.env.API_TENNIS_KEY;
  const url = `${BASE}?method=get_fixtures&APIkey=${key}&date_start=${isoDay(-14)}&date_stop=${isoDay(3)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`api-tennis responded ${res.status}`);
  const body = (await res.json()) as { success?: number; result?: Fixture[] };
  if (!body.success || !Array.isArray(body.result)) throw new Error("api-tennis returned no fixtures");

  const groups = new Map<string, { tour: Tour; event: ProEvent; name: string; fixtures: Fixture[] }>();
  for (const f of body.result) {
    const kind = EVENTS[f.event_type_type ?? ""];
    if (!kind) continue;
    const id = `${kind.tour.toLowerCase()}-${kind.event}-${f.tournament_key}`;
    const g = groups.get(id) ?? { ...kind, name: f.tournament_name, fixtures: [] };
    g.fixtures.push(f);
    groups.set(id, g);
  }

  const yesterday = isoDay(-1);
  const out: Group[] = [];
  for (const [id, g] of groups) {
    const matches = g.fixtures.map(toRaw).filter((m): m is RawMatch => m != null);
    if (!matches.length) continue;
    const days = g.fixtures.map((f) => f.event_date).sort();
    const final = matches.find((m) => m.roundSize === 1);
    const lastDay = days.at(-1)!;
    // Active = still has play in the last day or so, or a final that hasn't been decided.
    if (lastDay < yesterday && final?.status === "finished") continue;
    if (lastDay < yesterday && !matches.some((m) => m.status !== "finished")) continue;

    const rounds = assembleDraw(matches);
    out.push({
      matches,
      summary: {
        id,
        name: g.name,
        tour: g.tour,
        event: g.event,
        liveCount: matches.filter((m) => m.status === "live").length,
        currentRound: currentRoundName(rounds),
        firstDay: days[0],
        lastDay,
      },
    });
  }
  return out.sort(
    (a, b) =>
      b.summary.liveCount - a.summary.liveCount ||
      a.summary.tour.localeCompare(b.summary.tour) ||
      a.summary.event.localeCompare(b.summary.event) ||
      a.summary.name.localeCompare(b.summary.name),
  );
}

// One upstream call per minute is shared by every visitor.
const cachedGroups = unstable_cache(fetchGroups, ["api-tennis-groups"], { revalidate: 60 });

export const apiTennis: ProSource = {
  demo: false,
  async list() {
    return (await cachedGroups()).map((g) => g.summary);
  },
  async draw(id) {
    const group = (await cachedGroups()).find((g) => g.summary.id === id);
    return group ? ({ ...group.summary, rounds: assembleDraw(group.matches) } satisfies ProDraw) : null;
  },
};
