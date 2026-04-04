import { AppShell } from "@/components/layout/app-shell";
import { LobbyReadiness } from "@/components/onboarding/lobby-readiness";

export default function LobbyPage() {
  return (
    <AppShell
      eyebrow="Lobby"
      title="Fund the duel, randomize P1/P2, and wait for both sides to become ready."
      description="For MVP, the duel starts only when both players have chosen trust mode, connected a healthy runner, and funded the stake."
    >
      <LobbyReadiness />
    </AppShell>
  );
}
