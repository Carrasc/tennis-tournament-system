export function DemoNotice() {
  return (
    <p className="mt-6 max-w-2xl border-l-2 border-highlight pl-4 text-ink-soft">
      You&apos;re looking at <strong className="font-semibold text-ink">sample draws</strong>. To show real ATP and WTA
      draws, add an api-tennis.com key as <code className="rounded bg-paper px-1 text-[0.9em]">API_TENNIS_KEY</code> in
      the <code className="rounded bg-paper px-1 text-[0.9em]">.env</code> file.
    </p>
  );
}
