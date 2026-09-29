import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Poppins } from "next/font/google";
import { TornEdge } from "@/components/TornEdge";
import "./globals.css";

const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["300", "400"] });

export const metadata: Metadata = {
  title: { default: "Tennis Draws", template: "%s | Tennis Draws" },
  description: "Make a tennis draw for your club, share it with a code, and follow the ATP and WTA draws.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${plexMono.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur-md">
          <div className="frame flex min-h-16 flex-wrap items-center justify-between gap-x-8 gap-y-1 py-2">
            <Link href="/" className="text-xl tracking-tight">
              <span className="font-semibold">Tennis</span>
              <span className="font-light">Draws</span>
            </Link>
            <nav aria-label="Main" className="-mx-2 flex items-center gap-1 text-[0.9rem] text-ink-soft sm:gap-3">
              <Link href="/open" className="rounded-md px-2 py-2 whitespace-nowrap hover:text-ink">
                Enter a code
              </Link>
              <Link href="/pro" className="rounded-md px-2 py-2 whitespace-nowrap hover:text-ink">
                Pro tours
              </Link>
              <Link
                href="/new"
                className="ml-1 rounded-lg border border-ink px-3.5 py-1.5 font-medium whitespace-nowrap text-ink transition-colors hover:bg-ink hover:text-paper-light"
              >
                New tournament
              </Link>
            </nav>
          </div>
        </header>
        <main className="frame flex-1 pt-12 pb-28 md:pt-16">{children}</main>
        <footer className="relative bg-linen">
          <TornEdge color="var(--linen)" seed={9} />
          <div className="frame flex flex-wrap items-center justify-between gap-4 py-10 text-sm text-ink-soft">
            <span className="text-base tracking-tight text-ink">
              <span className="font-semibold">Tennis</span>
              <span className="font-light">Draws</span>
            </span>
            <span className="font-mono text-xs lowercase">every match, one clear draw</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
