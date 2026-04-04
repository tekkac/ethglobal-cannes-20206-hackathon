import { AppShell } from "@/components/layout/app-shell";
import { RunnerSetup } from "@/components/onboarding/runner-setup";

export default function AgentPage() {
  return (
    <AppShell
      eyebrow="Runner Setup"
      title="Arm the contestant with a runner the arena can actually trust to respond."
      description="Issue a token, bind it to a local or self-hosted runner, and prove that the relay is healthy before the lobby opens."
      activeHref="/agent"
      phase="Runner relay"
      timer="Health check pending"
      watchers="64 judges in pit lane"
      bannerFooter="Runner status is part of trust, not a hidden admin field. Healthy relay state should read like broadcast telemetry, not dashboard plumbing."
      metrics={[
        { label: "Transport", value: "Token-first runner flow", tone: "info" },
        { label: "Gate", value: "Healthy runner required", tone: "trusted" },
        { label: "Fallback", value: "Self-hosted later", tone: "neutral" },
      ]}
    >
      <RunnerSetup />
    </AppShell>
  );
}
