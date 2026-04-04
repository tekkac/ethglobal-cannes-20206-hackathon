import { renderToStaticMarkup } from "react-dom/server";

import AgentPage from "@/app/agent/page";
import HomePage from "@/app/page";
import LobbyPage from "@/app/lobby/page";
import PlayPage from "@/app/play/page";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function renderRoute(element: React.ReactElement) {
  return renderToStaticMarkup(element);
}

describe("UI route smoke tests", () => {
  it("renders the home route", () => {
    const html = renderRoute(<HomePage />);

    expect(html).toContain("Agent Duel Arena");
    expect(html).toContain("Player 1 vs Player 2");
    expect(html).toContain("Enter Arena");
  });

  it("renders the play route", () => {
    const html = renderRoute(<PlayPage />);

    expect(html).toContain("Identity Desk");
    expect(html).toContain("Current player state");
    expect(html).toContain("Enter the clean lane");
  });

  it("renders the agent route", () => {
    const html = renderRoute(<AgentPage />);

    expect(html).toContain("Runner Relay");
    expect(html).toContain("Runner state");
    expect(html).toContain("Issue token");
  });

  it("renders the lobby route", () => {
    const html = renderRoute(<LobbyPage />);

    expect(html).toContain("Readiness Gate");
    expect(html).toContain("Open Duels");
    expect(html).toContain("Create duel");
  });
});
