"use client";

import { useEffect, useState, useTransition } from "react";
import { useAccount } from "wagmi";

import type { TrustStatus } from "@agent-duel/shared";
import type { ISuccessResult } from "@worldcoin/idkit";

import { ArenaConnectButton } from "@/components/wallet/connect-button";
import { WorldIdButton } from "@/components/wallet/world-id-button";
import { IdentityAvatar } from "@/components/ui/arena-primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { storeWalletAddress } from "@/lib/client/session";

type PlayerRecord = {
  walletAddress: string;
  trustStatus: TrustStatus;
  displayName: string | null;
  ensName: string | null;
  ensAvatar: string | null;
  worldNullifierHash: string | null;
};

async function loadPlayer(walletAddress: string) {
  const response = await fetch(`/api/me?walletAddress=${encodeURIComponent(walletAddress)}`);
  if (!response.ok) return { player: null };
  return response.json();
}

export function PlayFlow() {
  const { address, isConnected } = useAccount();
  const walletAddress = address ?? "";
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const playerName = player?.ensName ?? player?.displayName ?? player?.walletAddress ?? null;

  // Sync wallet address to localStorage for other pages (lobby, runner)
  useEffect(() => {
    if (walletAddress) {
      storeWalletAddress(walletAddress);
    }
  }, [walletAddress]);

  // Load existing player when wallet connects
  useEffect(() => {
    if (!walletAddress) {
      setPlayer(null);
      return;
    }

    startTransition(async () => {
      const payload = await loadPlayer(walletAddress);
      setPlayer(payload.player);
    });
  }, [walletAddress]);

  function handleWorldIdSuccess(result: ISuccessResult) {
    if (!walletAddress) return;

    startTransition(async () => {
      const response = await fetch("/api/verify-world-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          worldNullifierHash: result.nullifier_hash,
          merkleRoot: result.merkle_root,
          proof: result.proof,
          verificationLevel: result.verification_level,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Verification failed.");
        return;
      }

      setPlayer(payload.player);
      setMessage("Verified. You're in the prime lane.");
    });
  }

  function handleEnterUnverified() {
    if (!walletAddress) return;

    startTransition(async () => {
      const response = await fetch("/api/continue-unverified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed.");
        return;
      }

      setPlayer(payload.player);
      setMessage("Entered as wildcard.");
    });
  }

  // Not connected — show connect prompt
  if (!isConnected) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="arena-panel px-6 py-10">
          <h2 className="text-2xl font-black text-white">Connect to Enter</h2>
          <p className="mt-3 text-sm text-[var(--arena-copy-muted)]">
            Connect your wallet to create or load your player profile.
          </p>
          <div className="mt-6 flex justify-center">
            <ArenaConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Player preview (shown when profile exists) */}
      {player ? (
        <div className="arena-panel mb-6 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <IdentityAvatar
              label={playerName ?? "?"}
              avatarUrl={player.ensAvatar}
              trustStatus={player.trustStatus}
              size="lg"
            />
            <div className="flex-1">
              <p className="text-xl font-black text-white">{playerName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge tone={player.trustStatus}>
                  {player.trustStatus === "trusted" ? "Prime lane" : "Wildcard"}
                </StatusBadge>
                {player.worldNullifierHash ? (
                  <span className="text-xs text-[var(--arena-copy-muted)]">World ID verified</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Lane selection */}
      <div className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
        {message ? (
          <div className="mb-4 rounded-[1.2rem] border-2 border-[#123f75]/14 bg-[linear-gradient(180deg,#93e5ff,#57c8ff)] px-4 py-3 text-sm font-semibold text-[#113b70] shadow-[0_6px_0_#1d92ca]">
            {message}
          </div>
        ) : null}

        <p className="mb-4 text-sm text-[var(--arena-copy-muted)]">
          Wallet connected: <span className="font-mono text-white">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <WorldIdButton
            walletAddress={walletAddress}
            onVerified={handleWorldIdSuccess}
            disabled={isPending}
          />

          <button
            type="button"
            onClick={handleEnterUnverified}
            disabled={isPending}
            className="rounded-[1.4rem] border-2 border-[#6f2414]/14 bg-[linear-gradient(180deg,rgba(255,180,123,0.3),rgba(255,107,94,0.12))] px-5 py-4 text-left transition hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <StatusBadge tone="untrusted">Wildcard</StatusBadge>
            <p className="mt-3 text-lg font-black text-white">Enter Unverified</p>
            <p className="mt-1 text-xs text-[var(--arena-copy-muted)]">
              Skip verification, play as wildcard
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
