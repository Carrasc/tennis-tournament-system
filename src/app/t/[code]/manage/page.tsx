import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { removePlayer, signOut, undoDraw } from "@/app/actions";
import { CodeForm } from "@/components/CodeForm";
import { isOrganiser } from "@/lib/session";
import { getTournament, toViewRounds } from "@/lib/tournaments";
import { TournamentHeading } from "../TournamentHeading";
import { AddPlayersForm, DetailsForm, MakeDrawButton, SeedSelect } from "./forms";
import { MatchEditor } from "./MatchEditor";
import { entryName, entryWord } from "@/lib/names";

export const metadata: Metadata = { title: "Update tournament" };

export default async function ManagePage({ params }: PageProps<"/t/[code]/manage">) {
  const t = await getTournament((await params).code);
  if (!t) notFound();

  if (!(await isOrganiser(t.id))) {
    return (
      <div className="max-w-xl">
        <h1 className="display text-[2.6rem] leading-[1.08] text-balance sm:text-[3.4rem]">Organiser code needed</h1>
        <p className="mt-3 mb-8 text-lg text-ink-soft">
          To change <strong>{t.name}</strong>, type the organiser code you got when you created it.
        </p>
        <div className="card px-5 py-6 sm:px-8">
          <CodeForm />
        </div>
      </div>
    );
  }

  const rounds = toViewRounds(t);
  const played = t.matches.some((m) => m.status === "finished" && m.outcome !== "bye");

  return (
    <div>
      <TournamentHeading tournament={t}>
        <div className="flex flex-wrap gap-2">
          <Link href={`/t/${t.publicCode}`} className="btn btn-secondary">
            See the draw
          </Link>
          <form action={signOut.bind(null, t.id)}>
            <button className="btn btn-quiet">Sign out on this device</button>
          </form>
        </div>
      </TournamentHeading>

      {t.status === "setup" ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="players-heading" className="card self-start px-5 py-6 sm:px-8">
            <h2 id="players-heading" className="display text-[1.9rem] leading-tight">
              {t.kind === "doubles" ? "Teams" : "Players"} ({t.participants.length})
            </h2>
            <p className="hint mt-1 mb-4">
              Give the strongest {entryWord(t.kind, 2)} a seed (1 is the best) so they don&apos;t meet early.
            </p>
            {t.participants.length ? (
              <ul className="divide-y divide-line border-y border-line">
                {t.participants.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-2">
                    <span className="min-w-0 flex-1 text-lg">{entryName(p)}</span>
                    <SeedSelect
                      tournamentId={t.id}
                      participantId={p.id}
                      seed={p.seed}
                      max={Math.max(1, Math.floor(t.participants.length / 2))}
                      playerName={entryName(p)}
                    />
                    <form action={removePlayer.bind(null, t.id, p.id)}>
                      <button className="btn btn-quiet min-h-11" aria-label={`Remove ${entryName(p)}`}>
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No {entryWord(t.kind, 2)} yet. Add them on the right.</p>
            )}

            <div className="mt-8">
              <MakeDrawButton tournamentId={t.id} kind={t.kind} playerCount={t.participants.length} />
            </div>
          </section>

          <div className="space-y-8">
            <AddPlayersForm tournamentId={t.id} kind={t.kind} />
            <DetailsForm tournament={t} />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {rounds.map((round, r) => {
            const matches = round.matches.filter((m) => m.outcome !== "bye");
            if (!matches.length) return null;
            return (
              <section key={round.name} aria-labelledby={`round-${r}`} className="card px-5 py-6 sm:px-8">
                <h2 id={`round-${r}`} className="display mb-4 text-[1.9rem] leading-tight">
                  {round.name}
                </h2>
                <ul className="space-y-5">
                  {matches.map((m) => (
                    <li key={m.id}>
                      <MatchEditor tournamentId={t.id} match={m} setsToWin={t.setsToWin} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <div className="grid gap-8 lg:grid-cols-2">
            <DetailsForm tournament={t} />
            {!played && (
              <section className="card self-start px-5 py-6 sm:px-8">
                <h2 className="display text-[1.9rem] leading-tight">Change the {entryWord(t.kind, 2)}</h2>
                <p className="mt-1 mb-4 text-ink-soft">
                  No results are in yet, so you can still go back, change {entryWord(t.kind, 2)} or seeds, and make a new draw.
                </p>
                <form action={undoDraw.bind(null, t.id)}>
                  <button className="btn btn-secondary">Go back to the list of {entryWord(t.kind, 2)}</button>
                </form>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
