import Link from "next/link";
import type { ReactNode } from "react";

import { ArenaConnectButton } from "@/components/wallet/connect-button";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/play", label: "Play" },
  { href: "/agent", label: "Runner" },
  { href: "/lobby", label: "Lobby" }
];

export function AppShell({
  children,
  activeHref,
  pageTitle,
}: {
  children: ReactNode;
  activeHref: string;
  pageTitle: string;
}) {
  return (
    <main className="arena-shell min-h-screen text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6">
        <header className="arena-panel px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 rounded-[999px] border border-[#0f2649]/12 bg-[linear-gradient(180deg,#fff2d8,#ffd893)] px-3.5 py-1.5 text-[#71470e] shadow-[0_4px_0_#ddb15c]">
                <span className="arena-live-dot h-2 w-2 rounded-full bg-[var(--arena-red)]" />
                <span className="arena-kicker text-[0.68rem]">Arena</span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                {pageTitle}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <nav className="flex flex-wrap gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-[0.85rem] border-2 px-3.5 py-2 text-sm font-extrabold transition ${
                      item.href === activeHref
                        ? "border-[#0f4a84]/16 bg-[linear-gradient(180deg,#74d8ff,#2db8ff)] text-[#113b70] shadow-[0_4px_0_#1e86be]"
                        : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))] text-[var(--arena-copy)] hover:-translate-y-0.5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <ArenaConnectButton />
            </div>
          </div>
        </header>

        <section className="flex-1 py-6 sm:py-8">{children}</section>
      </div>
    </main>
  );
}
