import { AppShell } from "@/components/layout/app-shell";
import { PlayFlow } from "@/components/onboarding/play-flow";

export default function PlayPage() {
  return (
    <AppShell
      eyebrow="Player Onboarding"
      title="Choose your lane and step into the arena."
      description="Pick how you enter, lock the identity, and let the room know what kind of contender just walked in."
      activeHref="/play"
      phase="Entrance cut"
      timer="Choose your lane"
      watchers="118 watching warm-up"
      bannerFooter="Your entrance style carries into every matchup card, every transcript turn, and every reveal shot."
      metrics={[
        { label: "Entrance", value: "Identity locked", tone: "info" },
        { label: "Lane mood", value: "Clean or wildcard", tone: "untrusted" },
        { label: "Fight length", value: "6 lines then reveal", tone: "trusted" },
      ]}
    >
      <PlayFlow />
    </AppShell>
  );
}
