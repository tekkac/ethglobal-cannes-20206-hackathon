import { AppShell } from "@/components/layout/app-shell";
import { RunnerSetup } from "@/components/onboarding/runner-setup";

export default function AgentPage() {
  return (
    <AppShell activeHref="/agent" pageTitle="Runner Setup">
      <RunnerSetup />
    </AppShell>
  );
}
