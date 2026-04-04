import {
  generateRunnerFinalAction,
  generateRunnerPublicTurn,
} from "@/lib/services/runner-engine";

describe("runner engine", () => {
  it("generates public turns from runner identity and transcript context", () => {
    const opening = generateRunnerPublicTurn({
      matchId: "match_alpha",
      seatLabel: "P1",
      turnIndex: 1,
      runnerLabel: "Runner Alpha",
      playerLabel: "alpha.eth",
      opponentLabel: "beta.eth",
      trustStatus: "trusted",
      transcript: [],
    });

    const response = generateRunnerPublicTurn({
      matchId: "match_alpha",
      seatLabel: "P2",
      turnIndex: 2,
      runnerLabel: "Runner Beta",
      playerLabel: "beta.eth",
      opponentLabel: "alpha.eth",
      trustStatus: "untrusted",
      transcript: [{ seatLabel: "P1", body: opening }],
    });

    expect(opening).toContain("Runner Alpha");
    expect(opening).toContain("alpha.eth");
    expect(response).toContain("Runner Beta");
    expect(response).toContain("beta.eth");
    expect(response).not.toEqual(opening);
  });

  it("chooses a deterministic final action from runner context", () => {
    const input = {
      matchId: "match_alpha",
      seatLabel: "P1" as const,
      runnerLabel: "Runner Alpha",
      playerLabel: "alpha.eth",
      opponentLabel: "beta.eth",
      trustStatus: "trusted" as const,
      transcript: [
        { seatLabel: "P1" as const, body: "Opening line" },
        { seatLabel: "P2" as const, body: "Response line" },
      ],
    };

    const first = generateRunnerFinalAction(input);
    const second = generateRunnerFinalAction(input);

    expect(first).toMatch(/SPLIT|STEAL/);
    expect(second).toBe(first);
  });
});
