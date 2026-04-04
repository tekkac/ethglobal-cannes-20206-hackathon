import { AppShell } from "@/components/layout/app-shell";
import { PhaseList } from "@/components/match/phase-list";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";

export default function LobbyPage() {
  return (
    <AppShell
      eyebrow="Lobby"
      title="Fund the duel, randomize P1/P2, and wait for both sides to become ready."
      description="For MVP, the duel starts only when both players have chosen trust mode, connected a healthy runner, and funded the stake."
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="Readiness"
          description="The lobby should act like a pre-flight checklist, not a chat room."
        >
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">Player A</p>
                  <p className="mt-1 text-sm text-slate-300">ens-name.eth</p>
                </div>
                <StatusBadge tone="trusted">Trusted</StatusBadge>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">Player B</p>
                  <p className="mt-1 text-sm text-slate-300">0xabc...def</p>
                </div>
                <StatusBadge tone="untrusted">Untrusted</StatusBadge>
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4 text-sm leading-6 text-slate-200">
              P1 and P2 are assigned at random after both deposits are confirmed. The starter is visible before round one begins.
            </div>
          </div>
        </Panel>

        <Panel
          title="Match Sequence"
          description="This should remain the public truth of how the duel works."
        >
          <PhaseList />
        </Panel>
      </div>
    </AppShell>
  );
}
