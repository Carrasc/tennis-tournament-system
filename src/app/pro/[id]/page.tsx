import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DrawView } from "@/components/DrawView";
import { proSource } from "@/lib/pro";
import { DemoNotice } from "@/components/DemoNotice";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/pro/[id]">): Promise<Metadata> {
  const draw = await proSource()
    .draw((await params).id)
    .catch(() => null);
  return { title: draw ? `${draw.name} ${draw.event}` : "Pro draw" };
}

export default async function ProDrawPage({ params }: PageProps<"/pro/[id]">) {
  const source = proSource();
  const draw = await source.draw((await params).id);
  if (!draw) notFound();

  return (
    <div>
      <AutoRefresh seconds={60} />
      <div className="mb-14">
        <p className="eyebrow mb-5">
          <Link href="/pro" className="hover:text-ink">
            pro tours
          </Link>
        </p>
        <h1 className="display text-[2.6rem] leading-[1.08] text-balance sm:text-[3.4rem]">{draw.name}</h1>
        <p className="mt-4 flex flex-wrap items-center gap-3 text-ink-soft">
          {draw.tour === "ATP" ? "Men's" : "Women's"} {draw.event}
          {draw.liveCount > 0 && (
            <span className="tag bg-live-bg text-live">
              <span aria-hidden className="size-1.5 rounded-full bg-live" />
              {draw.liveCount} playing now
            </span>
          )}
        </p>
        {source.demo && <DemoNotice />}
      </div>
      <DrawView rounds={draw.rounds} />
    </div>
  );
}
