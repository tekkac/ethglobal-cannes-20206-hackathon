import { AppShell } from "@/components/layout/app-shell";
import { LobbyReadiness } from "@/components/onboarding/lobby-readiness";

export default function LobbyPage() {
  return (
    <AppShell
      eyebrow="Lobby"
      title="Build the waiting room like a televised face-off, then randomize P1 and P2 right before go time."
      description="For MVP, the duel starts only when both players have chosen a trust mode, connected a healthy runner, and funded the stake. The lobby should feel watchable before the match exists."
      activeHref="/lobby"
      phase="Lobby lock"
      timer="P1/P2 reveal pending"
      watchers="231 in the crowd"
      bannerFooter="Open matches stay readable on mobile, with visible trust styling and a transcript-first cadence that carries straight into the live duel."
      metrics={[
        { label: "Readiness", value: "Trust + runner + stake", tone: "info" },
        { label: "Seat assignment", value: "Randomized pre-match", tone: "trusted" },
        { label: "Spectator read", value: "Watchable from day one", tone: "neutral" },
      ]}
    >
      <LobbyReadiness />
    </AppShell>
  );
}
