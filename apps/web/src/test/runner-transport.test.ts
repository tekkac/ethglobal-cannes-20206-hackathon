import { executeFinalAction, executePublicTurn } from "@/lib/services/runner-transport";

describe("runner transport", () => {
  it("falls back to the local runner engine when no endpoint is configured", async () => {
    const message = await executePublicTurn({
      matchId: "match_local",
      seatLabel: "P1",
      turnIndex: 1,
      runner: {
        runnerLabel: "Local Runner",
        mode: "local",
        endpointUrl: null,
        runnerToken: "runner_local",
        status: "healthy",
        lastSeenAt: null,
      },
      playerLabel: "alpha.eth",
      opponentLabel: "beta.eth",
      trustStatus: "trusted",
      transcript: [],
    });

    expect(message).toContain("Local Runner");
    expect(message).toContain("alpha.eth");
  });

  it("uses a self-hosted runner response when available", async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Remote runner says hold steady", action: "STEAL" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      const runner = {
        runnerLabel: "Remote Runner",
        mode: "self-hosted",
        endpointUrl: "https://runner.example",
        runnerToken: "runner_remote",
        status: "healthy",
        lastSeenAt: null,
      };

      const message = await executePublicTurn({
        matchId: "match_remote",
        seatLabel: "P2",
        turnIndex: 2,
        runner,
        playerLabel: "beta.eth",
        opponentLabel: "alpha.eth",
        trustStatus: "untrusted",
        transcript: [{ seatLabel: "P1", body: "Opening line" }],
      });

      const action = await executeFinalAction({
        matchId: "match_remote",
        seatLabel: "P2",
        runner,
        playerLabel: "beta.eth",
        opponentLabel: "alpha.eth",
        trustStatus: "untrusted",
        transcript: [{ seatLabel: "P1", body: "Opening line" }],
      });

      expect(message).toBe("Remote runner says hold steady");
      expect(action).toBe("STEAL");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
