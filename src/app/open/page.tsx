import type { Metadata } from "next";
import { CodeForm } from "@/components/CodeForm";

export const metadata: Metadata = { title: "Enter a code" };

export default function OpenPage() {
  return (
    <div className="max-w-xl">
      <h1 className="display text-[2.6rem] leading-[1.08] text-balance sm:text-[3.4rem]">Enter a code</h1>
      <p className="mt-3 mb-8 text-lg text-ink-soft">
        The <strong>6-letter code</strong> shows a tournament&apos;s draw. The <strong>organiser code</strong> (like
        ABCD-EFGH) lets you add players and enter results.
      </p>
      <div className="card px-5 py-6 sm:px-8">
        <CodeForm />
      </div>
    </div>
  );
}
