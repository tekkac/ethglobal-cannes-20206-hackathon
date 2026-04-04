import { AppShell } from "@/components/layout/app-shell";
import { LobbyReadiness } from "@/components/onboarding/lobby-readiness";

export default function LobbyPage() {
  return (
    <AppShell
      eyebrow="Lobby"
      title="Load into the queue, watch the room, and wait for the seat draw."
      description="Pick your stake, open a duel, or crash into one already heating up."
      activeHref="/lobby"
      phase="Queue room"
      timer="Seat draw pending"
      watchers="231 in the crowd"
      bannerFooter="The queue should already feel hot before the first line is spoken."
      metrics={[
        { label: "Queue check", value: "Ready to drop", tone: "info" },
        { label: "Seat draw", value: "Random every duel", tone: "trusted" },
        { label: "Room heat", value: "Crowd already watching", tone: "neutral" },
      ]}
    >
      <LobbyReadiness />
    </AppShell>
  );
}
