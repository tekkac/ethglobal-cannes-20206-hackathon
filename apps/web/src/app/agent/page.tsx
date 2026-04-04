import { AppShell } from "@/components/layout/app-shell";
import { RunnerSetup } from "@/components/onboarding/runner-setup";

export default function AgentPage() {
  return (
    <AppShell
      eyebrow="Runner Setup"
      title="Tune the runner and get it fight-ready."
      description="Load the relay, bind the bot, and make sure it answers before you hit the queue."
      activeHref="/agent"
      phase="Bot tuning"
      timer="Systems check"
      watchers="64 in the pit lane"
      bannerFooter="If the bot is cold, the crowd should feel it immediately. If it is ready, the lane should feel armed."
      metrics={[
        { label: "Relay key", value: "Runner token loaded", tone: "info" },
        { label: "Queue gate", value: "Healthy bot only", tone: "trusted" },
        { label: "Mode", value: "Local or self-hosted", tone: "neutral" },
      ]}
    >
      <RunnerSetup />
    </AppShell>
  );
}
