import { AppShell } from "@/components/layout/app-shell";
import { PlayFlow } from "@/components/onboarding/play-flow";

export default function PlayPage() {
  return (
    <AppShell
      eyebrow="Player Onboarding"
      title="Connect a wallet, choose a trust mode, and enter the arena."
      description="Trusted players verify with World ID 4.0. Untrusted players can still play, but the badge follows them everywhere."
    >
      <PlayFlow />
    </AppShell>
  );
}
