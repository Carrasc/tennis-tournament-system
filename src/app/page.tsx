import Link from "next/link";
import { DrawView } from "@/components/DrawView";
import { CodeForm } from "@/components/CodeForm";
import { TornEdge } from "@/components/TornEdge";
import type { ViewMatch, ViewRound } from "@/lib/types";

// A finished eight-player club draw, shown as an example on the home page.
type Result = [string, string, 0 | 1, [number, number, number?][]];
const done = ([p1, p2, winner, sets]: Result, id: string): ViewMatch => ({
  id,
  players: [{ name: p1 }, { name: p2 }],
  winner,
  sets: sets.map(([a, b, tb]) => ({ a, b, tb })),
  status: "finished",
  outcome: "normal",
});

const SAMPLE: ViewRound[] = [
  {
    name: "Quarter-finals",
    matches: (
      [
        ["Maria Lopez", "Grace Kim", 0, [[6, 2], [6, 3]]],
        ["Ruth Okafor", "Helen Brandt", 0, [[7, 5], [3, 6], [6, 4]]],
        ["Ana Petrova", "Lucia Rossi", 0, [[6, 4], [7, 6, 3]]],
        ["Sara Cohen", "Joan Walsh", 1, [[2, 6], [4, 6]]],
      ] as Result[]
    ).map((r, i) => done(r, `q${i}`)),
  },
  {
    name: "Semi-finals",
    matches: [
      done(["Maria Lopez", "Ruth Okafor", 0, [[6, 3], [7, 5]]], "s0"),
      done(["Ana Petrova", "Joan Walsh", 1, [[4, 6], [5, 7]]], "s1"),
    ],
  },
  { name: "Final", matches: [done(["Maria Lopez", "Joan Walsh", 0, [[7, 6, 4], [6, 4]]], "f")] },
];

const STEPS = [
  ["Create the tournament", "Give it a name, a place and a date. You get a private organiser code."],
  ["Add the players", "Paste the names, one per line, and mark the strongest players as seeds."],
  ["Make the draw", "Seeds are kept apart and everyone else is placed at random, like on the pro tours."],
  ["Share the code", "Players and family open the draw with a 6-letter code and see every result."],
];

export default function Home() {
  return (
    <>
      <section className="pb-16 lg:pb-20">
        <p className="eyebrow">tennis tournaments</p>
        <h1 className="display mt-7 text-[3.1rem] leading-[1.04] sm:text-[4.6rem] lg:text-[5.4rem]">
          Every match.
          <br />
          <span className="text-accent">One clear draw.</span>
        </h1>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          <p className="flex max-w-lg gap-4 text-lg text-ink-soft">
            <span aria-hidden className="text-accent">
              +
            </span>
            Run your club tournament on one page. Add the players, and the draw is made for you.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/new" className="btn btn-primary">
              Start a tournament
            </Link>
            <Link href="/open" className="btn btn-secondary">
              Enter a code
            </Link>
          </div>
        </div>
      </section>

      <figure className="mb-28 lg:mb-36">
        <div className="card overflow-hidden px-5 pt-6 pb-2 sm:px-8 sm:pt-7">
          <figcaption className="mb-8 flex items-baseline justify-between gap-6 border-b border-line pb-5">
            <span className="text-lg font-medium">Riverside Club Championship</span>
            <span className="font-mono text-xs text-muted lowercase">an example draw</span>
          </figcaption>
          <DrawView rounds={SAMPLE} initialRound={0} bare />
        </div>
      </figure>

      <section className="bleed relative bg-mist">
        <TornEdge color="var(--mist)" seed={4} />
        <div className="frame grid gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
          <div>
            <p className="eyebrow">how it works</p>
            <h2 className="display mt-6 text-[2.4rem] leading-[1.1] sm:text-[3.2rem]">
              Four steps.
              <br />
              <span className="text-accent">No paperwork.</span>
            </h2>
          </div>
          <ol className="border-t border-line">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="flex gap-6 border-b border-line py-6">
                <span className="pt-1 font-mono text-sm text-muted">0{i + 1}</span>
                <span>
                  <span className="block text-lg font-medium">{title}</span>
                  <span className="mt-1 block text-ink-soft">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="grid gap-12 pt-24 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="eyebrow">have a code?</p>
          <h2 className="display mt-6 text-[2.1rem] leading-tight">Open a tournament</h2>
          <p className="mt-3 mb-6 text-ink-soft">Type the code to see a draw, or your organiser code to update it.</p>
          <CodeForm />
        </div>
        <div>
          <p className="eyebrow">pro tours</p>
          <h2 className="display mt-6 text-[2.1rem] leading-tight">Follow the ATP and WTA</h2>
          <p className="mt-3 mb-6 text-ink-soft">This week&apos;s singles and doubles draws, with scores that update every minute.</p>
          <Link href="/pro" className="btn btn-secondary">
            See the pro draws
          </Link>
        </div>
      </section>
    </>
  );
}
