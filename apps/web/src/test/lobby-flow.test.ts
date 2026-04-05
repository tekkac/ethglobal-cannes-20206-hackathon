import { vi } from "vitest";

vi.mock("@/lib/services/settlement", () => ({
  resolveMatchOnChain: vi.fn().mockResolvedValue({ error: "not configured" }),
  cancelMatchOnChain: vi.fn().mockResolvedValue({ error: "not configured" }),
}));

vi.mock("@/lib/services/ens", () => ({
  resolveEnsProfile: vi.fn().mockImplementation((address: string) => {
    const short = address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
    return Promise.resolve({
      name: `arena-${short}`,
      avatar: `data:image/svg+xml;base64,dGVzdA==`,
    });
  }),
}));

import {
  claimMatchPayout,
  createMatch,
  getMatchDetail,
  joinMatch,
  listRecentMatches,
  listOpenMatches,
} from "@/lib/services/matches";
import {
  getRunnerByWallet,
  registerRunner,
  testRunner,
  upsertPlayer,
} from "@/lib/services/players";

describe("lobby flow services", () => {
  it("requires a healthy runner before creating a match", async () => {
    await upsertPlayer({
      walletAddress: "0xaaa",
      trustStatus: "trusted",
      worldNullifierHash: "dev-aaa",
    });

    const result = await createMatch({
      walletAddress: "0xaaa",
      stakeAmount: "5",
    });

    expect(result).toEqual({
      error:
        "Player must choose trust mode and register a healthy runner before entering the lobby.",
    });
  });

  it("creates and joins a match when both players are lobby ready", async () => {
    await upsertPlayer({
      walletAddress: "0x111",
      trustStatus: "trusted",
      worldNullifierHash: "dev-111",
    });
    await registerRunner({
      walletAddress: "0x111",
      runnerLabel: "Runner A",
      mode: "local",
      endpointUrl: null,
      runnerToken: "runner-a",
    });
    await testRunner("0x111");

    await upsertPlayer({
      walletAddress: "0x222",
      trustStatus: "untrusted",
    });
    await registerRunner({
      walletAddress: "0x222",
      runnerLabel: "Runner B",
      mode: "local",
      endpointUrl: null,
      runnerToken: "runner-b",
    });
    await testRunner("0x222");

    expect((await getRunnerByWallet("0x111"))?.status).toBe("healthy");
    expect((await getRunnerByWallet("0x222"))?.status).toBe("healthy");

    const created = await createMatch({
      walletAddress: "0x111",
      stakeAmount: "7",
    });

    expect("match" in created).toBe(true);
    if (!("match" in created)) {
      return;
    }

    expect(await listOpenMatches()).toHaveLength(1);
    expect(created.match.playerA?.trustStatus).toBe("trusted");

    const joined = await joinMatch(created.match.id, "0x222");

    expect("match" in joined).toBe(true);
    if (!("match" in joined)) {
      return;
    }

    expect(joined.match.status).toBe("live");
    expect(joined.match.playerB?.trustStatus).toBe("untrusted");
    expect(await listOpenMatches()).toHaveLength(0);

    const initialDetail = await getMatchDetail(created.match.id, {
      nowMs: Date.parse("2026-04-04T20:00:00.000Z"),
    });
    expect(initialDetail).not.toBeNull();
  });

  it("advances transcript visibility as the live match clock moves", async () => {
    await upsertPlayer({
      walletAddress: "0x333",
      trustStatus: "trusted",
      worldNullifierHash: "dev-333",
    });
    await registerRunner({
      walletAddress: "0x333",
      runnerLabel: "Runner C",
      mode: "local",
      endpointUrl: null,
      runnerToken: "runner-c",
    });
    await testRunner("0x333");

    await upsertPlayer({
      walletAddress: "0x444",
      trustStatus: "untrusted",
    });
    await registerRunner({
      walletAddress: "0x444",
      runnerLabel: "Runner D",
      mode: "local",
      endpointUrl: null,
      runnerToken: "runner-d",
    });
    await testRunner("0x444");

    const created = await createMatch({
      walletAddress: "0x333",
      stakeAmount: "9",
    });

    if (!("match" in created)) {
      throw new Error("Expected match creation to succeed");
    }

    const joined = await joinMatch(created.match.id, "0x444");

    if (!("match" in joined)) {
      throw new Error("Expected join to succeed");
    }

    const liveStartedAt = Date.now();
    const opening = await getMatchDetail(created.match.id, { nowMs: liveStartedAt });
    const midFight = await getMatchDetail(created.match.id, { nowMs: liveStartedAt + 11_000 });
    const resolved = await getMatchDetail(created.match.id, { nowMs: liveStartedAt + 40_000 });

    expect(opening?.phase).toBe("waiting_to_start");
    expect(opening?.transcript).toHaveLength(0);
    expect(opening?.commitmentState.playerOneCommitted).toBe(false);
    expect(midFight?.phase).toBe("live_round_3");
    expect(midFight?.transcript.length).toBeGreaterThanOrEqual(3);
    expect(midFight?.finalActions.playerOne).toBeNull();
    expect(midFight?.commitmentState.revealVerified).toBe(false);
    expect(resolved?.phase).toBe("resolved");
    expect(resolved?.transcript).toHaveLength(9);
    expect(resolved?.finalActions.playerOne).toMatch(/SPLIT|STEAL/);
    expect(resolved?.finalActions.playerTwo).toMatch(/SPLIT|STEAL/);
    expect(resolved?.commitmentState.playerOneCommitted).toBe(true);
    expect(resolved?.commitmentState.playerTwoCommitted).toBe(true);
    expect(resolved?.commitmentState.revealVerified).toBe(true);
    expect(resolved?.resolutionSummary).toBeTruthy();

    const persisted = await getMatchDetail(created.match.id, { nowMs: liveStartedAt + 40_000 });
    expect(persisted?.transcript).toHaveLength(9);
    expect(persisted?.phase).toBe("resolved");
  });

  it("allows claim after verified reveal when a payout exists", async () => {
    await upsertPlayer({
      walletAddress: "0x999",
      trustStatus: "trusted",
      worldNullifierHash: "dev-999",
    });
    await registerRunner({
      walletAddress: "0x999",
      runnerLabel: "Runner Nine",
      mode: "local",
      endpointUrl: null,
      runnerToken: "runner-9",
    });
    await testRunner("0x999");

    await upsertPlayer({
      walletAddress: "0xaaa9",
      trustStatus: "untrusted",
    });
    await registerRunner({
      walletAddress: "0xaaa9",
      runnerLabel: "Runner Ten",
      mode: "local",
      endpointUrl: null,
      runnerToken: "runner-10",
    });
    await testRunner("0xaaa9");

    const created = await createMatch({
      walletAddress: "0x999",
      stakeAmount: "4",
    });

    if (!("match" in created)) {
      throw new Error("Expected match creation to succeed");
    }

    const joined = await joinMatch(created.match.id, "0xaaa9");

    if (!("match" in joined)) {
      throw new Error("Expected join to succeed");
    }

    const resolved = await getMatchDetail(created.match.id, { nowMs: Date.now() + 40_000 });
    expect(resolved?.commitmentState.revealVerified).toBe(true);

    const playerOnePayout = Number.parseFloat(resolved?.settlement.playerOnePayout ?? "0");
    const playerTwoPayout = Number.parseFloat(resolved?.settlement.playerTwoPayout ?? "0");
    const claimant =
      playerOnePayout > 0
        ? resolved?.playerOne?.walletAddress ?? null
        : playerTwoPayout > 0
          ? resolved?.playerTwo?.walletAddress ?? null
          : null;

    if (!claimant) {
      expect(resolved?.settlement.status).toBe("settled");
      return;
    }

    const claimResult = await claimMatchPayout(created.match.id, claimant);
    expect("ok" in claimResult && claimResult.ok).toBe(true);

    const afterClaim = await getMatchDetail(created.match.id, { nowMs: Date.now() + 41_000 });
    expect(afterClaim?.settlement.status).toMatch(/claimable|settled/);
    expect(afterClaim?.settlement.playerOneClaimed || afterClaim?.settlement.playerTwoClaimed).toBe(
      true,
    );

    const recentMatches = await listRecentMatches();
    const recentMatch = recentMatches.find((entry) => entry.id === created.match.id);
    expect(recentMatch).toBeTruthy();
    expect(recentMatch?.playerOne?.ensAvatar).toContain("data:image/svg+xml;base64");
    expect(recentMatch?.playerTwo?.ensAvatar).toContain("data:image/svg+xml;base64");
  });
});
