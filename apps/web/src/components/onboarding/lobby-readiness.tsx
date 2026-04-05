"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useAccount } from "wagmi";

import { ArenaConnectButton } from "@/components/wallet/connect-button";
import { IdentityAvatar } from "@/components/ui/arena-primitives";
import { StatusBadge } from "@/components/ui/status-badge";

type MePayload = {
  player: {
    walletAddress: string;
    trustStatus: "trusted" | "untrusted";
    displayName: string | null;
    ensName: string | null;
    ensAvatar: string | null;
  } | null;
  runner: {
    runnerLabel: string;
    status: string;
  } | null;
};

type OpenMatch = {
  id: string;
  stakeAmount: string;
  status: string;
  playerA: {
    walletAddress: string;
    trustStatus: "trusted" | "untrusted";
    displayName: string | null;
    ensName: string | null;
    ensAvatar: string | null;
  } | null;
};

type RecentMatch = {
  id: string;
  stakeAmount: string;
  status: string;
  phase: string;
  resolvedAt: string | null;
  resolutionSummary: string | null;
  winningSeat: "P1" | "P2" | "draw" | null;
  playerOne: {
    walletAddress: string;
    trustStatus: "trusted" | "untrusted";
    displayName: string | null;
    ensName: string | null;
    ensAvatar: string | null;
  } | null;
  playerTwo: {
    walletAddress: string;
    trustStatus: "trusted" | "untrusted";
    displayName: string | null;
    ensName: string | null;
    ensAvatar: string | null;
  } | null;
  settlement: {
    status: "pending" | "claimable" | "settled";
    playerOnePayout: string;
    playerTwoPayout: string;
    playerOneClaimed: boolean;
    playerTwoClaimed: boolean;
  };
};

function renderName(
  player:
    | MePayload["player"]
    | OpenMatch["playerA"]
    | RecentMatch["playerOne"]
    | RecentMatch["playerTwo"],
  fallback: string,
) {
  return player?.ensName ?? player?.displayName ?? player?.walletAddress ?? fallback;
}

function formatTime(value: string | null) {
  if (!value) return "Pending";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Pending" : date.toLocaleString();
}

export function LobbyReadiness() {
  const [data, setData] = useState<MePayload | null>(null);
  const [stakeAmount, setStakeAmount] = useState("5");
  const [openMatches, setOpenMatches] = useState<OpenMatch[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const { address, isConnected } = useAccount();
  const walletAddress = address ?? "";

  async function refreshLobbyState(activeWalletAddress: string) {
    const [meResponse, matchesResponse] = await Promise.all([
      fetch(`/api/me?walletAddress=${encodeURIComponent(activeWalletAddress)}`),
      fetch("/api/matches"),
    ]);

    const mePayload = await meResponse.json();
    const matchesPayload = await matchesResponse.json();

    setData(mePayload);
    setOpenMatches(matchesPayload.matches ?? []);
    setRecentMatches(matchesPayload.recentMatches ?? []);
  }

  useEffect(() => {
    if (!walletAddress) return;

    startTransition(async () => {
      await refreshLobbyState(walletAddress);
    });
  }, [walletAddress]);

  const player = data?.player ?? null;
  const runner = data?.runner ?? null;
  const ready = Boolean(player && runner?.status === "healthy");
  const playerName = renderName(player, "No contestant");

  function handleCreateMatch() {
    if (!walletAddress) {
      setMessage("No saved wallet address.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, stakeAmount }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to create match.");
        return;
      }

      await refreshLobbyState(walletAddress);
      setActiveMatchId(payload.match.id);
      setMessage("Match created. Waiting for opponent.");
    });
  }

  function handleSelfPlay() {
    if (!walletAddress) {
      setMessage("No saved wallet address.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/matches/self-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, stakeAmount }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to create self-play match.");
        return;
      }

      await refreshLobbyState(walletAddress);
      setActiveMatchId(payload.match.id);
      setMessage("Self-play match started. Your agent plays both sides.");
    });
  }

  function handleJoinMatch(matchId: string) {
    if (!walletAddress) {
      setMessage("No saved wallet address.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/matches/${matchId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to join match.");
        return;
      }

      await refreshLobbyState(walletAddress);
      setActiveMatchId(payload.match.id);
      setMessage("Joined. Duel is live.");
    });
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="arena-panel px-6 py-10">
          <h2 className="text-2xl font-black text-white">Connect to Enter Lobby</h2>
          <p className="mt-3 text-sm text-[var(--arena-copy-muted)]">
            Connect your wallet to create or join duels.
          </p>
          <div className="mt-6 flex justify-center">
            <ArenaConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
      {/* Left: Readiness + Create */}
      <div className="grid gap-6">
        {/* Readiness status bar */}
        <div className="arena-panel px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {player ? (
                <>
                  <IdentityAvatar
                    label={playerName}
                    avatarUrl={player.ensAvatar}
                    trustStatus={player.trustStatus}
                    size="sm"
                  />
                  <span className="font-bold text-white">{playerName}</span>
                  <StatusBadge tone={player.trustStatus}>
                    {player.trustStatus === "trusted" ? "Prime" : "Wildcard"}
                  </StatusBadge>
                </>
              ) : (
                <span className="text-sm text-[var(--arena-copy-muted)]">No player profile</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge tone={runner?.status === "healthy" ? "trusted" : "untrusted"}>
                Bot: {runner?.status ?? "offline"}
              </StatusBadge>
              <div
                className={`rounded-[999px] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] ${
                  ready
                    ? "bg-[linear-gradient(180deg,#86ebc4,#5ed6a7)] text-[#0f4b38]"
                    : "bg-[linear-gradient(180deg,#ffb47b,#ff855b)] text-[#742e18]"
                }`}
              >
                {ready ? "Ready" : "Not ready"}
              </div>
            </div>
          </div>
        </div>

        {/* Create duel */}
        <div className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
          {message ? (
            <div className="mb-4 rounded-[1.2rem] border-2 border-[#123f75]/14 bg-[linear-gradient(180deg,#93e5ff,#57c8ff)] px-4 py-3 text-sm font-semibold text-[#113b70] shadow-[0_6px_0_#1d92ca]">
              {message}
            </div>
          ) : null}

          <div className="grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Stake (USDC)</span>
              <input
                value={stakeAmount}
                onChange={(event) => setStakeAmount(event.target.value)}
                className="arena-input"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleCreateMatch}
                disabled={isPending || !ready}
                className="arena-button-primary"
              >
                Create duel
              </button>
              <button
                type="button"
                onClick={handleSelfPlay}
                disabled={isPending || !ready}
                className="arena-button-secondary"
              >
                Self-play test
              </button>
            </div>

            {activeMatchId ? (
              <Link href={`/match/${activeMatchId}`} className="arena-button-secondary text-center">
                Go to live feed
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => {
                if (!walletAddress) return;
                startTransition(async () => {
                  await refreshLobbyState(walletAddress);
                });
              }}
              disabled={isPending}
              className="arena-button-secondary"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Right: Open duels + Results */}
      <div className="grid gap-6">
        {/* Open duels */}
        <div className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
          <h2 className="mb-4 text-xl font-black text-white">Open Duels</h2>
          <div className="grid gap-3">
            {openMatches.length > 0 ? (
              openMatches.map((match) => {
                const entrantName = renderName(match.playerA, "Unknown");
                const entrantTrusted = match.playerA?.trustStatus === "trusted";

                return (
                  <div
                    key={match.id}
                    className={`relative overflow-hidden rounded-[1.6rem] border-2 p-4 shadow-[0_14px_22px_rgba(10,19,38,0.14)] ${
                      entrantTrusted
                        ? "border-[#0f3d72]/14 bg-[linear-gradient(180deg,rgba(134,235,196,0.25),rgba(76,171,135,0.08))]"
                        : "border-[#6f2414]/14 bg-[linear-gradient(180deg,rgba(255,180,123,0.25),rgba(255,107,94,0.08))]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {match.playerA ? (
                          <IdentityAvatar
                            label={entrantName}
                            avatarUrl={match.playerA.ensAvatar}
                            trustStatus={match.playerA.trustStatus}
                            size="sm"
                          />
                        ) : null}
                        <div>
                          <p className="font-bold text-white">{entrantName}</p>
                          <p className="text-xs text-[var(--arena-copy-muted)]">
                            {match.stakeAmount} USDC · {match.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/match/${match.id}`} className="arena-button-secondary">
                          Watch
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleJoinMatch(match.id)}
                          disabled={isPending || !ready}
                          className="arena-button-primary"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-[var(--arena-copy-muted)]">No open duels yet.</p>
            )}
          </div>
        </div>

        {/* Recent results */}
        <div className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
          <h2 className="mb-4 text-xl font-black text-white">Recent Results</h2>
          <div className="grid gap-3">
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => {
                const playerOneName = renderName(match.playerOne, "P1");
                const playerTwoName = renderName(match.playerTwo, "P2");
                const winnerLabel =
                  match.winningSeat === "P1"
                    ? `${playerOneName} won`
                    : match.winningSeat === "P2"
                      ? `${playerTwoName} won`
                      : "Draw";

                return (
                  <div key={match.id} className="rounded-[1.4rem] border-2 border-white/10 bg-white/[0.06] px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">{winnerLabel}</p>
                        {match.resolutionSummary ? (
                          <p className="mt-1 text-xs text-[var(--arena-copy-muted)]">{match.resolutionSummary}</p>
                        ) : null}
                      </div>
                      <Link href={`/match/${match.id}`} className="arena-button-secondary">
                        Replay
                      </Link>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {[
                        { seat: "P1", player: match.playerOne, payout: match.settlement.playerOnePayout, claimed: match.settlement.playerOneClaimed },
                        { seat: "P2", player: match.playerTwo, payout: match.settlement.playerTwoPayout, claimed: match.settlement.playerTwoClaimed },
                      ].map(({ seat, player: p, payout, claimed }) => (
                        <div key={seat} className="flex items-center justify-between gap-2 rounded-[1rem] border border-white/10 bg-white/[0.05] px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            {p ? (
                              <IdentityAvatar label={renderName(p, seat)} avatarUrl={p.ensAvatar} trustStatus={p.trustStatus} size="sm" />
                            ) : null}
                            <span className="text-white">{renderName(p, seat)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--arena-copy-muted)]">{payout} USDC</span>
                            <StatusBadge tone={claimed ? "trusted" : "info"}>
                              {claimed ? "Claimed" : "Pending"}
                            </StatusBadge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 flex justify-between text-xs text-[var(--arena-copy-muted)]">
                      <span>{match.phase.replaceAll("_", " ")}</span>
                      <span>{formatTime(match.resolvedAt)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-[var(--arena-copy-muted)]">No finished duels yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
