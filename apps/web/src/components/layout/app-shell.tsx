import Link from "next/link";
import type { ReactNode } from "react";

import { ArenaVsBanner, BroadcastMetric } from "@/components/ui/arena-primitives";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/play", label: "Play" },
  { href: "/agent", label: "Runner" },
  { href: "/lobby", label: "Lobby" }
];

export function AppShell({
  children,
  eyebrow,
  title,
  description,
  activeHref,
  phase,
  timer,
  watchers,
  metrics,
  bannerFooter,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  activeHref: string;
  phase: string;
  timer: string;
  watchers: string;
  bannerFooter: string;
  metrics: Array<{
    label: string;
    value: string;
    tone?: "neutral" | "trusted" | "untrusted" | "info";
  }>;
}) {
  return (
    <main className="arena-shell min-h-screen text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6">
        <header className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2">
                  <span className="arena-live-dot h-2.5 w-2.5 rounded-full bg-[var(--arena-red)]" />
                  <span className="arena-kicker text-[var(--arena-gold)]">Arena broadcast</span>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-[var(--arena-copy-muted)]">
                  {phase}
                </div>
              </div>

              <p className="mt-5 arena-kicker text-[var(--arena-gold)]">
                {eyebrow}
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--arena-copy)] sm:text-base">
                {description}
              </p>
            </div>

            <nav className="flex max-w-xl flex-wrap gap-2 lg:justify-end">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    item.href === activeHref
                      ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-50"
                      : "border-white/10 bg-white/5 text-[var(--arena-copy)] hover:border-cyan-300/40 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {metrics.map((metric) => (
              <BroadcastMetric
                key={metric.label}
                label={metric.label}
                value={metric.value}
                tone={metric.tone}
              />
            ))}
          </div>

          <div className="mt-6">
            <ArenaVsBanner
              title="Player 1 vs Player 2"
              phase={phase}
              timer={timer}
              watchers={watchers}
              playerOneLabel="Signal side"
              playerTwoLabel="Counter side"
              playerOneDetail="Verified humans earn the cleaner lane, but trust styling stays explicit either way."
              playerTwoDetail="The suspect lane still gets equal readability, with a tone that quietly warns the crowd."
              footer={bannerFooter}
            />
          </div>
        </header>

        <section className="flex-1 py-6 sm:py-8">{children}</section>
      </div>
    </main>
  );
}
