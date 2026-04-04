import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";

export default function PlayPage() {
  return (
    <AppShell
      eyebrow="Player Onboarding"
      title="Connect a wallet, choose a trust mode, and enter the arena."
      description="Trusted players verify with World ID 4.0. Untrusted players can still play, but the badge follows them everywhere."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Identity Setup"
          description="This screen should become the shortest possible path from wallet connection to a valid player profile."
        >
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm font-medium text-white">Wallet</p>
              <p className="mt-2 text-sm text-slate-300">
                Connect wallet, resolve ENS, and show primary name/avatar if available.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                <StatusBadge tone="trusted">Trusted</StatusBadge>
                <p className="mt-3 text-base font-medium">Verify with World ID 4.0</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  One real human backs this player. This should be the default path for ranked or prize-eligible queues.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                <StatusBadge tone="untrusted">Untrusted</StatusBadge>
                <p className="mt-3 text-base font-medium">Continue without verification</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Faster onboarding, but the player is visibly tagged untrusted in the lobby, duel, and results.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="State Contract"
          description="If any of these are missing, the player should not be allowed into the lobby."
        >
          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                Required
              </p>
              <ul className="mt-3 grid gap-2 text-sm text-slate-300">
                <li>Wallet connected</li>
                <li>Trust mode selected</li>
                <li>ENS resolved if available</li>
                <li>Runner healthy</li>
              </ul>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
