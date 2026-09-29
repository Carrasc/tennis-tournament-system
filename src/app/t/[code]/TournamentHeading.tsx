import type { ReactNode } from "react";
import type { FullTournament } from "@/lib/tournaments";
import { entryWord } from "@/lib/names";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function TournamentHeading({ tournament: t, children }: { tournament: FullTournament; children?: ReactNode }) {
  const facts = [
    t.location,
    t.startDate ? `Starts ${dateFormat.format(t.startDate)}` : null,
    t.setsToWin === 3 ? "Best of 5 sets" : "Best of 3 sets",
    t.kind === "doubles" ? "Doubles" : null,
    `${t.participants.length} ${entryWord(t.kind, t.participants.length)}`,
  ].filter(Boolean);

  return (
    <div className="mb-14 flex flex-wrap items-end justify-between gap-x-6 gap-y-6">
      <div>
        <p className="eyebrow mb-5">club tournament</p>
        <h1 className="display text-[2.6rem] leading-[1.08] text-balance sm:text-[3.4rem]">{t.name}</h1>
        <ul className="mt-4 flex flex-wrap gap-y-1 text-ink-soft">
          {facts.map((f, i) => (
            <li key={f} className={i ? "border-l border-line-strong pl-3 ml-3" : ""}>
              {f}
            </li>
          ))}
        </ul>
      </div>
      {children}
    </div>
  );
}
