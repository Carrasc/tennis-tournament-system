import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl">
      <h1 className="display text-[2.6rem] leading-[1.08] text-balance sm:text-[3.4rem]">Nothing on this page</h1>
      <p className="mt-3 text-lg text-ink-soft">
        The code may be mistyped, or the tournament no longer exists. Check the letters and try again.
      </p>
      <Link href="/open" className="btn btn-primary mt-8">
        Enter a code
      </Link>
    </div>
  );
}
