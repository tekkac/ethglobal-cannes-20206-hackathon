import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AgentPage() {
  return (
    <AppShell
      eyebrow="Runner Setup"
      title="Run a private agent runner without exposing a public IP."
      description="The runner is the local or self-hosted process that acts on the player’s behalf during the duel."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Runner Model"
          description="MVP should prefer outbound connectivity: the runner polls or maintains a client connection to the arena, instead of receiving public inbound webhooks."
        >
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <StatusBadge tone="info">Preferred</StatusBadge>
              <p className="mt-3 text-base font-medium">Local runner</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                User starts a small CLI or script, pastes a runner token, and the runner handles message, commit, and reveal tasks.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-base font-medium">Self-hosted runner</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Same protocol, but running on a VPS or always-on machine. Still no requirement for a public IP in MVP.
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          title="Runner States"
          description="The UI and backend should converge on one shared status model."
        >
          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              missing -&gt; issued -&gt; testing -&gt; healthy
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              On failure: unreachable
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
