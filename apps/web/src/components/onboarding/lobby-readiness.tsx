"use client";

import { useEffect, useState, useTransition } from "react";

import { PhaseList } from "@/components/match/phase-list";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { loadStoredWalletAddress } from "@/lib/client/session";

type MePayload = {
  player: {
    walletAddress: string;
    trustStatus: "trusted" | "untrusted";
    displayName: string | null;
    ensName: string | null;
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
  } | null;
};

export function LobbyReadiness() {
  const [data, setData] = useState<MePayload | null>(null);
  const [stakeAmount, setStakeAmount] = useState("5");
  const [openMatches, setOpenMatches] = useState<OpenMatch[]>([]);
  const [message, setMessage] = useState("Load a saved player profile to check readiness.");
  const [isPending, startTransition] = useTransition();
  const walletAddress = loadStoredWalletAddress();

  async function refreshLobbyState(activeWalletAddress: string) {
    const [meResponse, matchesResponse] = await Promise.all([
      fetch(`/api/me?walletAddress=${encodeURIComponent(activeWalletAddress)}`),
      fetch("/api/matches")
    ]);

    const mePayload = await meResponse.json();
    const matchesPayload = await matchesResponse.json();

    setData(mePayload);
    setOpenMatches(matchesPayload.matches ?? []);
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

  function handleCreateMatch() {
    if (!walletAddress) {
      setMessage("No saved wallet address found.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          walletAddress,
          stakeAmount
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to create match.");
        return;
      }

      await refreshLobbyState(walletAddress);
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          walletAddress
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to join match.");
        return;
      }

      await refreshLobbyState(walletAddress);
      setMessage("Joined match. Duel is ready for the next phase.");
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel
        title="Readiness"
        description="This is the first real pre-flight check for a player entering the duel."
      >
        <div className="grid gap-4">
          <p className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </p>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            {player ? (
              <div className="grid gap-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Player</span>
                  <span className="font-medium text-white">
                    {player.ensName ?? player.displayName ?? player.walletAddress}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Trust</span>
                  <StatusBadge tone={player.trustStatus}>
                    {player.trustStatus === "trusted" ? "Trusted" : "Might Be A Sybil"}
                  </StatusBadge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Runner</span>
                  {runner ? (
                    <StatusBadge tone={runner.status === "healthy" ? "trusted" : "info"}>
                      {runner.status}
                    </StatusBadge>
                  ) : (
                    <span>No runner</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No player found. Finish onboarding first.</p>
            )}
          </div>

          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4 text-sm leading-6 text-slate-200">
            {ready
              ? "Ready for lobby creation. P1 and P2 are assigned at random right before the match starts."
              : "Not ready yet. A saved player profile and healthy runner are required before entering the lobby."}
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Stake amount</span>
              <input
                value={stakeAmount}
                onChange={(event) => setStakeAmount(event.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
              />
            </label>

            <button
              type="button"
              onClick={handleCreateMatch}
              disabled={isPending || !ready}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-300/50 disabled:opacity-50"
            >
              Create duel
            </button>
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
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-300/50 disabled:opacity-60"
          >
            Refresh readiness
          </button>
        </div>
      </Panel>

      <Panel
        title="Open Duels"
        description="Create or join a duel here. P1 and P2 are assigned at random only after the lobby is full."
      >
        <div className="grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <PhaseList />
          </div>

          <div className="grid gap-3">
            {openMatches.length > 0 ? (
              openMatches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {match.playerA?.ensName ??
                          match.playerA?.displayName ??
                          match.playerA?.walletAddress ??
                          "Unknown player"}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Stake: {match.stakeAmount} USDC
                      </p>
                    </div>
                    <StatusBadge
                      tone={match.playerA?.trustStatus === "trusted" ? "trusted" : "untrusted"}
                    >
                      {match.playerA?.trustStatus === "trusted"
                        ? "Trusted"
                        : "Might Be A Sybil"}
                    </StatusBadge>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleJoinMatch(match.id)}
                    disabled={isPending || !ready}
                    className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-300/50 disabled:opacity-50"
                  >
                    Join duel
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                No open duels yet.
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
