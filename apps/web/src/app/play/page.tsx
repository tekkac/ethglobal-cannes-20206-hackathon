import { AppShell } from "@/components/layout/app-shell";
import { PlayFlow } from "@/components/onboarding/play-flow";

export default function PlayPage() {
  return (
    <AppShell activeHref="/play" pageTitle="Choose Your Lane">
      <PlayFlow />
    </AppShell>
  );
}
