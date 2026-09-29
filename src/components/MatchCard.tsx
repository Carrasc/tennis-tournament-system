import { entryName } from "@/lib/names";
import type { Side, ViewMatch } from "@/lib/types";

type Props = { match: ViewMatch; inList?: boolean };

/** One match on a soft card: a player per row, set scores beside each name, a small tag above for status. */
export function MatchCard({ match, inList = false }: Props) {
  const note = statusTag(match);
  const live = match.status === "live";
  const bye = match.outcome === "bye";

  return (
    <div className="relative w-full" role="group" aria-label={describe(match)}>
      {note && (
        <p
          className={`tag ${live ? "bg-live-bg text-live" : "px-0 text-ink-soft"} ${
            inList ? "mb-2" : "absolute -top-7 left-0 whitespace-nowrap"
          }`}
        >
          {live && <span aria-hidden className="size-1.5 rounded-full bg-live" />}
          {note}
        </p>
      )}
      {/* A bye is only sketched in: dashed outline, no card. */}
      <div
        className={`divide-y ${
          bye
            ? "divide-dashed divide-line-strong rounded-2xl border border-dashed border-line-strong"
            : `card divide-line ${live ? "border-live/40" : ""}`
        }`}
      >
        <PlayerLine match={match} side={0} />
        <PlayerLine match={match} side={1} />
      </div>
    </div>
  );
}

function PlayerLine({ match, side }: { match: ViewMatch; side: 0 | 1 }) {
  const player = match.players[side];
  const won = match.winner === side;
  const lost = match.winner != null && !won;

  return (
    <div className={`flex min-h-11 items-center gap-3 px-4 ${player.partner ? "py-2" : ""} ${lost ? "text-ink-soft" : "text-ink"}`}>
      <span className="min-w-0 flex-1" title={player.name ? entryName(player) : undefined}>
        <Name player={player} won={won} />
      </span>
      {/* In doubles the seed gets its own column so it is never cut off with a long name. */}
      {player.partner && player.seed ? (
        <span className="shrink-0 font-mono text-[0.78rem] text-muted">[{player.seed}]</span>
      ) : null}
      {match.sets.map((set, s) => {
        const games = side === 0 ? set.a : set.b;
        const other = side === 0 ? set.b : set.a;
        const wonSet = games > other;
        return (
          <span key={s} className={`w-4 text-right tabular-nums ${wonSet ? "font-semibold text-ink" : ""}`}>
            {games}
            {set.tb != null && !wonSet && <sup className="ml-px text-[0.62em] font-normal">{set.tb}</sup>}
          </span>
        );
      })}
    </div>
  );
}

function Name({ player, won }: { player: Side; won: boolean }) {
  if (player.bye) return <span className="font-mono text-sm text-faint lowercase">bye</span>;
  if (!player.name) return <span className="text-faint">To be decided</span>;
  const seed = player.seed ? <span className="ml-2 font-mono text-[0.78rem] text-muted">[{player.seed}]</span> : null;
  // Doubles: one partner under the other, so both full names stay readable.
  if (player.partner) {
    return (
      <span className="block leading-snug">
        <span className="block truncate">
          <span className={won ? "highlight font-medium" : ""}>{player.name}</span>
        </span>
        <span className="block truncate">
          <span className={won ? "highlight font-medium" : ""}>{player.partner}</span>
        </span>
      </span>
    );
  }
  return (
    <span className="block truncate">
      <span className={won ? "highlight font-medium" : ""}>{player.name}</span>
      {seed}
    </span>
  );
}

function statusTag(m: ViewMatch) {
  if (m.outcome === "bye") return null;
  if (m.status === "live") return m.note ? `playing now, ${m.note}` : "playing now";
  if (m.outcome === "walkover") return "walkover";
  if (m.outcome === "retired") return "retired";
  if (m.status === "pending") return m.note || null;
  return null;
}

function describe(m: ViewMatch) {
  const [a, b] = m.players.map((p) => (p.bye ? "bye" : p.name ? entryName(p) : "to be decided"));
  if (m.outcome === "bye") return `${m.winner === 1 ? b : a} goes through with a bye`;
  if (m.winner != null) return `${entryName(m.players[m.winner])} beat ${m.winner === 0 ? b : a}`;
  return `${a} against ${b}`;
}
