import { renderToStaticMarkup } from "react-dom/server";

import { LiveMatchView } from "@/components/match/live-match-view";

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

describe("live match view", () => {
  it("renders identity avatars, transcript, and payout board", () => {
    const html = renderToStaticMarkup(
      <LiveMatchView
        matchId="match_demo"
        initialMatch={{
          id: "match_demo",
          stakeAmount: "5",
          status: "resolved",
          phase: "resolved",
          phaseLabel: "Resolved",
          phaseIndex: 10,
          totalPhases: 10,
          watcherCount: 144,
          timerLabel: "Broadcast complete",
          readyToWatch: true,
          resolutionSummary: "alpha.eth revealed STEAL against beta.eth's SPLIT.",
          commitmentState: {
            playerOneCommitted: true,
            playerTwoCommitted: true,
            revealVerified: true,
            verificationError: null,
          },
          finalActions: {
            playerOne: "STEAL",
            playerTwo: "SPLIT",
          },
          settlement: {
            status: "claimable",
            playerOnePayout: "10.00",
            playerTwoPayout: "0.00",
            playerOneClaimed: false,
            playerTwoClaimed: false,
          },
          playerA: {
            walletAddress: "0x111",
            trustStatus: "trusted",
            displayName: "alpha",
            ensName: "alpha.eth",
            ensAvatar: "data:image/svg+xml;base64,alpha",
          },
          playerB: {
            walletAddress: "0x222",
            trustStatus: "untrusted",
            displayName: "beta",
            ensName: "beta.eth",
            ensAvatar: "data:image/svg+xml;base64,beta",
          },
          playerOne: {
            walletAddress: "0x111",
            trustStatus: "trusted",
            displayName: "alpha",
            ensName: "alpha.eth",
            ensAvatar: "data:image/svg+xml;base64,alpha",
          },
          playerTwo: {
            walletAddress: "0x222",
            trustStatus: "untrusted",
            displayName: "beta",
            ensName: "beta.eth",
            ensAvatar: "data:image/svg+xml;base64,beta",
          },
          transcript: [
            {
              id: "turn_1",
              phase: "live_round_1",
              turnIndex: 1,
              speakerRole: "player",
              speakerLabel: "alpha.eth",
              seatLabel: "P1",
              body: "Opening move.",
              tone: "p1",
            },
            {
              id: "turn_2",
              phase: "resolved",
              turnIndex: 9,
              speakerRole: "system",
              speakerLabel: "Arena desk",
              seatLabel: null,
              body: "Resolution summary.",
              tone: "system",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("alpha.eth");
    expect(html).toContain("beta.eth");
    expect(html).toContain("Live transcript");
    expect(html).toContain("Prize board");
    expect(html).toContain("10.00 USDC");
    expect(html).toContain("Reveal open: yes");
  });
});
