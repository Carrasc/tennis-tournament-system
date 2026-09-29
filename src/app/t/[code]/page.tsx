import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CopyButton } from "@/components/CopyButton";
import { DrawView } from "@/components/DrawView";
import { isOrganiser } from "@/lib/session";
import { champion, getTournament, toViewRounds } from "@/lib/tournaments";
import { TournamentHeading } from "./TournamentHeading";
import { entryName } from "@/lib/names";

export async function generateMetadata({ params }: PageProps<"/t/[code]">): Promise<Metadata> {
  const t = await getTournament((await params).code);
  return { title: t?.name ?? "Tournament not found" };
}

export default async function TournamentPage({ params }: PageProps<"/t/[code]">) {
  const t = await getTournament((await params).code);
  if (!t) notFound();
  const organiser = await isOrganiser(t.id);
  const winner = champion(t);

  return (
    <div>
      <AutoRefresh seconds={30} />
      <TournamentHeading tournament={t}>
        {organiser && (
          <Link href={`/t/${t.publicCode}/manage`} className="btn btn-primary">
            Update the tournament
          </Link>
        )}
      </TournamentHeading>

      {winner && (
        <div className="mb-14">
          <p className="eyebrow">champion</p>
          <p className="display mt-3 text-4xl">
            <span className="highlight">{entryName(winner)}</span>
          </p>
        </div>
      )}

      {t.status === "setup" ? (
        <section className="card px-5 py-6 sm:px-8">
          <p className="text-lg">The draw hasn&apos;t been made yet. {t.kind === "doubles" ? "Teams" : "Players"} signed up so far:</p>
          {t.participants.length ? (
            <ol className="mt-4 list-decimal space-y-1 pl-8 text-lg marker:text-muted">
              {t.participants.map((p) => (
                <li key={p.id}>
                  {entryName(p)}
                  {p.seed ? <span className="ml-2 text-muted">(seed {p.seed})</span> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-muted">Nobody yet.</p>
          )}
        </section>
      ) : (
        <DrawView rounds={toViewRounds(t)} />
      )}

      <footer className="mt-10 flex flex-wrap items-center gap-3 text-ink-soft">
        <span>
          Draw code <strong className="font-mono text-lg font-normal tracking-[0.15em] text-ink">{t.publicCode}</strong>
        </span>
        <CopyButton value={t.publicCode} label="Copy code" />
        <span className="hint">Scores update by themselves every 30 seconds.</span>
      </footer>
    </div>
  );
}
