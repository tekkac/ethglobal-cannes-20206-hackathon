import { AppShell } from "@/components/layout/app-shell";
import { LobbyReadiness } from "@/components/onboarding/lobby-readiness";

export default function LobbyPage() {
  return (
    <AppShell activeHref="/lobby" pageTitle="Lobby">
      <LobbyReadiness />
    </AppShell>
  );
}
