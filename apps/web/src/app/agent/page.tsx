import { AppShell } from "@/components/layout/app-shell";
import { RunnerSetup } from "@/components/onboarding/runner-setup";

export default function AgentPage() {
  return (
    <AppShell
      eyebrow="Runner Setup"
      title="Run a private agent runner without exposing a public IP."
      description="The runner is the local or self-hosted process that acts on the player’s behalf during the duel."
    >
      <RunnerSetup />
    </AppShell>
  );
}
