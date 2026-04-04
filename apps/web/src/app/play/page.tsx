import { AppShell } from "@/components/layout/app-shell";
import { PlayFlow } from "@/components/onboarding/play-flow";

export default function PlayPage() {
  return (
    <AppShell
      eyebrow="Player Onboarding"
      title="Lock a human into the arena before any duel can queue."
      description="Trusted players verify with World ID 4.0. Untrusted players can still enter, but the suspect styling follows them on cards, in the lobby, and through the live transcript."
      activeHref="/play"
      phase="Identity lock-in"
      timer="Queue gate open"
      watchers="118 watching warm-up"
      bannerFooter="The duel view will inherit this same broadcast framing, with trust treatment visible on every contestant card and transcript turn."
      metrics={[
        { label: "Queue rule", value: "Wallet + trust required", tone: "info" },
        { label: "Broadcast mood", value: "Trusted vs suspect", tone: "untrusted" },
        { label: "MVP format", value: "6 public messages", tone: "trusted" },
      ]}
    >
      <PlayFlow />
    </AppShell>
  );
}
