"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { PhaseList } from "@/components/match/phase-list";
import {
  BroadcastMetric,
  IdentityAvatar,
  TranscriptPreview,
} from "@/components/ui/arena-primitives";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { loadStoredWalletAddress } from "@/lib/client/session";

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

function renderContestantName(
  player:
    | MePayload["player"]
    | OpenMatch["playerA"]
    | RecentMatch["playerOne"]
    | RecentMatch["playerTwo"],
  fallback: string,
) {
  return player?.ensName ?? player?.displayName ?? player?.walletAddress ?? fallback;
}

function formatResolutionTime(value: string | null) {
  if (!value) {
    return "Awaiting official close";
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Awaiting official close" : date.toLocaleString();
}

export function LobbyReadiness() {
  const [data, setData] = useState<MePayload | null>(null);
  const [stakeAmount, setStakeAmount] = useState("5");
  const [openMatches, setOpenMatches] = useState<OpenMatch[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [message, setMessage] = useState("Load a saved player profile to check readiness.");
  const [isPending, startTransition] = useTransition();
  const walletAddress = loadStoredWalletAddress();

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
    if (!walletAddress) {
      return;
    }

    startTransition(async () => {
      await refreshLobbyState(walletAddress);
      setMessage("Loaded current readiness state.");
    });
  }, [walletAddress]);

  const player = data?.player ?? null;
  const runner = data?.runner ?? null;
  const ready = Boolean(player && runner?.status === "healthy");
  const playerName = renderContestantName(player, "No contestant");

  function handleCreateMatch() {
    if (!walletAddress) {
      setMessage("No saved wallet address found.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          stakeAmount,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to create match.");
        return;
      }

      await refreshLobbyState(walletAddress);
      setActiveMatchId(payload.match.id);
      setMessage("Match created. Waiting for an opponent.");
    });
  }

  function handleJoinMatch(matchId: string) {
    if (!walletAddress) {
      setMessage("No saved wallet address found.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/matches/${matchId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to join match.");
        return;
      }

      await refreshLobbyState(walletAddress);
      setActiveMatchId(payload.match.id);
      setMessage("Joined match. Duel is ready for the next phase.");
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
      <div className="grid gap-6">
        <Panel
          title="Readiness Gate"
          description="This is still the real lobby pre-flight check, but it now reads like a televised queue desk instead of a backend checklist."
        >
          <div className="grid gap-4">
            <div className="arena-surface border-cyan-400/20 bg-cyan-400/10 px-4 py-4 text-sm leading-6 text-cyan-50">
              {message}
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(5,8,14,0.78))] p-5">
              {player ? (
                <div className="grid gap-3 text-sm text-[var(--arena-copy)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <IdentityAvatar
                        label={playerName}
                        avatarUrl={player.ensAvatar}
                        trustStatus={player.trustStatus}
                        size="lg"
                      />
                      <div>
                        <p className="arena-kicker text-[var(--arena-copy-muted)]">Contestant</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{playerName}</p>
                      </div>
                    </div>
                    <StatusBadge tone={player.trustStatus}>
                      {player.trustStatus === "trusted" ? "Trusted entrant" : "Might be a sybil"}
                    </StatusBadge>
                  </div>

                  <div className="arena-surface flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-[var(--arena-copy-muted)]">Runner</span>
                    {runner ? (
                      <StatusBadge tone={runner.status === "healthy" ? "trusted" : "info"}>
                        {runner.status}
                      </StatusBadge>
                    ) : (
                      <span className="font-medium text-white">No runner</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 text-[var(--arena-copy-muted)]">
                  No player found. Finish onboarding first so the lobby has a contestant identity to present.
                </p>
              )}
            </div>

            <div
              className={`arena-surface px-4 py-4 text-sm leading-6 ${
                ready
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-50"
                  : "border-amber-400/20 bg-amber-400/10 text-amber-50"
              }`}
            >
              {ready
                ? "Ready for lobby creation. P1 and P2 are assigned at random right before the match starts."
                : "Not ready yet. A saved player profile and healthy runner are required before entering the lobby."}
            </div>

            <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(6,10,16,0.82))] p-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-white">Stake amount</span>
                <input
                  value={stakeAmount}
                  onChange={(event) => setStakeAmount(event.target.value)}
                  className="arena-input"
                />
              </label>

              <button
                type="button"
                onClick={handleCreateMatch}
                disabled={isPending || !ready}
                className="arena-button-primary"
              >
                Create duel
              </button>

              {activeMatchId ? (
                <Link href={`/match/${activeMatchId}`} className="arena-button-secondary text-center">
                  Open live feed
                </Link>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                const storedWallet = loadStoredWalletAddress();
                if (!storedWallet) {
                  setMessage("No saved wallet address found.");
                  return;
                }

                startTransition(async () => {
                  await refreshLobbyState(storedWallet);
                  setMessage("Refreshed readiness state.");
                });
              }}
              disabled={isPending}
              className="arena-button-secondary"
            >
              Refresh readiness
            </button>
          </div>
        </Panel>

        <div className="grid gap-3 md:grid-cols-3">
          <BroadcastMetric
            label="Contestant"
            value={player ? "Identity locked" : "Missing player"}
            tone={player ? player.trustStatus : "neutral"}
          />
          <BroadcastMetric
            label="Runner"
            value={runner?.status === "healthy" ? "Healthy" : "Not healthy"}
            tone={runner?.status === "healthy" ? "trusted" : "untrusted"}
          />
          <BroadcastMetric
            label="Lobby access"
            value={ready ? "Unlocked" : "Blocked"}
            tone={ready ? "trusted" : "info"}
          />
        </div>
      </div>

      <div className="grid gap-6">
        <Panel
          title="Open Duels"
          description="Create or join a duel here. P1 and P2 are assigned at random only after the lobby is full, so the waiting room needs to feel watchable first."
        >
          <div className="grid gap-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(5,8,14,0.76))] p-4">
              <PhaseList />
            </div>

            <div className="grid gap-3">
              {openMatches.length > 0 ? (
                openMatches.map((match) => {
                  const entrantName = renderContestantName(match.playerA, "Unknown player");
                  const entrantTrusted = match.playerA?.trustStatus === "trusted";

                  return (
                    <div
                      key={match.id}
                      className={`rounded-[1.75rem] border p-5 ${
                        entrantTrusted
                          ? "border-emerald-400/20 bg-[linear-gradient(180deg,rgba(103,217,163,0.12),rgba(5,8,14,0.76))]"
                          : "border-amber-400/20 bg-[linear-gradient(180deg,rgba(243,166,63,0.16),rgba(5,8,14,0.76))]"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {match.playerA ? (
                            <IdentityAvatar
                              label={entrantName}
                              avatarUrl={match.playerA.ensAvatar}
                              trustStatus={match.playerA.trustStatus}
                            />
                          ) : null}
                          <div>
                            <p className="arena-kicker text-[var(--arena-copy-muted)]">Open seat</p>
                            <p className="mt-2 text-lg font-semibold text-white">{entrantName}</p>
                            <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">
                              Stake: {match.stakeAmount} USDC
                            </p>
                          </div>
                        </div>
                        <StatusBadge tone={entrantTrusted ? "trusted" : "untrusted"}>
                          {entrantTrusted ? "Trusted" : "Might be a sybil"}
                        </StatusBadge>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <div className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.28em] text-[var(--arena-copy-muted)]">
                            {match.status}
                          </div>
                          <Link href={`/match/${match.id}`} className="arena-button-secondary">
                            Watch feed
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJoinMatch(match.id)}
                          disabled={isPending || !ready}
                          className="arena-button-secondary"
                        >
                          Join duel
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="arena-surface px-4 py-4 text-sm leading-6 text-[var(--arena-copy-muted)]">
                  No open duels yet. Create one from the readiness desk to seed the broadcast queue.
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Panel
          title="Recent Results"
          description="The arena now remembers who fought, who won, and whether payouts were claimed. That gives the broadcast some memory instead of resetting after every duel."
        >
          <div className="grid gap-3">
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => {
                const playerOneName = renderContestantName(match.playerOne, "Player 1");
                const playerTwoName = renderContestantName(match.playerTwo, "Player 2");
                const winningLabel =
                  match.winningSeat === "P1"
                    ? `${playerOneName} took the duel`
                    : match.winningSeat === "P2"
                      ? `${playerTwoName} took the duel`
                      : "Cooperative finish or deadlock";

                return (
                  <div key={match.id} className="arena-surface px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="arena-kicker text-[var(--arena-copy-muted)]">Resolved duel</p>
                        <p className="mt-2 text-lg font-semibold text-white">{winningLabel}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">
                          {match.resolutionSummary ?? "Result is recorded and ready for replay."}
                        </p>
                      </div>
                      <Link href={`/match/${match.id}`} className="arena-button-secondary">
                        Review feed
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {[
                        {
                          seat: "P1",
                          player: match.playerOne,
                          payout: match.settlement.playerOnePayout,
                          claimed: match.settlement.playerOneClaimed,
                        },
                        {
                          seat: "P2",
                          player: match.playerTwo,
                          payout: match.settlement.playerTwoPayout,
                          claimed: match.settlement.playerTwoClaimed,
                        },
                      ].map(({ seat, player, payout, claimed }) => (
                        <div key={seat} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                          <div className="flex items-center gap-3">
                            {player ? (
                              <IdentityAvatar
                                label={renderContestantName(player, seat)}
                                avatarUrl={player.ensAvatar}
                                trustStatus={player.trustStatus}
                              />
                            ) : null}
                            <div>
                              <p className="arena-kicker text-[var(--arena-copy-muted)]">{seat}</p>
                              <p className="mt-1 font-semibold text-white">{renderContestantName(player, seat)}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--arena-copy)]">
                            <span>{payout} USDC</span>
                            <StatusBadge tone={claimed ? "trusted" : "info"}>
                              {claimed ? "Claimed" : "Unclaimed"}
                            </StatusBadge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] text-[var(--arena-copy-muted)]">
                      <span>{match.phase.replaceAll("_", " ")}</span>
                      <span>{formatResolutionTime(match.resolvedAt)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="arena-surface px-4 py-4 text-sm leading-6 text-[var(--arena-copy-muted)]">
                No finished duels yet. Close one full broadcast and the archive will start filling in here.
              </div>
            )}
          </div>
        </Panel>

        <TranscriptPreview
          eyebrow="Queue commentary"
          title="The lobby already behaves like a pre-match broadcast"
          description="Readiness, random seat assignment, and open-duel cards are all framed as part of the spectator experience. This keeps the lobby useful even before the match route is fully polished."
          turns={[
            {
              marker: "Queue desk",
              speaker: "Arena desk",
              text: ready
                ? "Contestant cleared. The desk can accept a stake and create a duel."
                : "Contestant blocked. The crowd can see exactly which gate is still missing.",
              tone: "system",
            },
            {
              marker: "Seat reveal",
              speaker: "Player 2",
              text: "P1 and P2 stay hidden until the lobby closes, so the waiting room needs strong suspense on its own.",
              tone: "p2",
            },
            {
              marker: "Match rule",
              speaker: "Arena desk",
              text: "Exactly six public messages, then commit and reveal. The timeline stays visible here so the next screen feels like a continuation, not a reset.",
              tone: "system",
            },
          ]}
        />
      </div>
    </div>
  );
}
