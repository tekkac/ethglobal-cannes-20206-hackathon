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

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (props: Record<string, unknown>) => React.ReactNode }) =>
      children({ account: null, chain: null, openConnectModal: () => {}, mounted: true }),
  },
  RainbowKitProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  darkTheme: () => ({}),
  getDefaultConfig: () => ({}),
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: class {},
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderRoute(element: React.ReactElement) {
  return renderToStaticMarkup(element);
}

describe("UI route smoke tests", () => {
  it("renders the home route", () => {
    const html = renderRoute(<HomePage />);

    expect(html).toContain("Agent Duel Arena");
    expect(html).toContain("Enter Arena");
    expect(html).toContain("Two minds");
  });

  it("renders the play route (disconnected)", () => {
    const html = renderRoute(<PlayPage />);

    expect(html).toContain("Choose Your Lane");
    expect(html).toContain("Connect to Enter");
    expect(html).toContain("Connect Wallet");
  });

  it("renders the agent route (disconnected)", () => {
    const html = renderRoute(<AgentPage />);

    expect(html).toContain("Runner Setup");
    expect(html).toContain("Connect to Setup Runner");
    expect(html).toContain("Connect Wallet");
  });

  it("renders the lobby route (disconnected)", () => {
    const html = renderRoute(<LobbyPage />);

    expect(html).toContain("Connect to Enter Lobby");
    expect(html).toContain("Connect Wallet");
  });
});
