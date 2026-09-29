import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DemoNotice } from "@/components/DemoNotice";
import { proSource, type ProSummary } from "@/lib/pro";

export const metadata: Metadata = { title: "Pro tours" };
export const dynamic = "force-dynamic";

export default async function ProPage() {
  const source = proSource();
  let tournaments: ProSummary[] = [];
  let failed = false;
  try {
    tournaments = await source.list();
  } catch (e) {
    console.error(e);
    failed = true;
  }

  const tours = (["ATP", "WTA"] as const).map((tour) => ({
    tour,
    title: tour === "ATP" ? "Men's tour (ATP)" : "Women's tour (WTA)",
    items: tournaments.filter((t) => t.tour === tour),
  }));

  return (
    <div>
      <AutoRefresh seconds={60} />
      <h1 className="display text-[2.6rem] leading-[1.08] text-balance sm:text-[3.4rem]">Pro tours</h1>
      <p className="mt-3 text-lg text-ink-soft">Singles and doubles draws being played this week. Scores update every minute.</p>
      {source.demo && <DemoNotice />}

      {failed ? (
        <p role="alert" className="mt-10 text-lg text-danger">
          The live scores service didn&apos;t answer. This page will try again in a minute.
        </p>
      ) : (
        <div className="card mt-10 grid gap-10 px-5 py-7 sm:px-8 lg:grid-cols-2">
          {tours.map(({ tour, title, items }) => (
            <section key={tour} aria-labelledby={`tour-${tour}`}>
              <h2 id={`tour-${tour}`} className="eyebrow mb-2">
                {title}
              </h2>
              {items.length ? (
                <ul>
                  {items.map((t) => (
                    <li key={t.id}>
                      <Link href={`/pro/${t.id}`} className="group flex items-center gap-4 border-b border-line py-4">
                        <span className="min-w-0 flex-1">
                          <span className="block text-xl font-medium underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-ink">
                            {t.name}
                          </span>
                          <span className="text-ink-soft">
                            {t.event === "doubles" ? "Doubles" : "Singles"}
                            {t.currentRound && `, now at the ${t.currentRound.toLowerCase()}`}
                          </span>
                        </span>
                        {t.liveCount > 0 && (
                          <span className="tag shrink-0 bg-live-bg text-live">
                            <span aria-hidden className="size-1.5 rounded-full bg-live" />
                            {t.liveCount} playing now
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-muted">No tournaments this week.</p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
