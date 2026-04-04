import Link from "next/link";
import type { ReactNode } from "react";

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
  description
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#07111d_0%,_#0b1325_45%,_#04060a_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {description}
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/50 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="flex-1 py-10">{children}</section>
      </div>
    </main>
  );
}
