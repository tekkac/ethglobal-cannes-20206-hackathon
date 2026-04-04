"use client";

import { useEffect, useState, useTransition } from "react";

import type { TrustStatus } from "@agent-duel/shared";

import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { loadStoredWalletAddress, storeWalletAddress } from "@/lib/client/session";

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
  return response.json();
}

export function PlayFlow() {
  const [walletAddress, setWalletAddress] = useState(() => loadStoredWalletAddress());
  const [worldNullifierHash, setWorldNullifierHash] = useState("");
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [message, setMessage] = useState("Use a wallet address to create or load a player profile.");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    startTransition(async () => {
      const payload = await loadPlayer(walletAddress);
      setPlayer(payload.player);
      if (payload.player) {
        setMessage("Loaded existing player profile.");
      }
    });
  }, [walletAddress]);

  function submitTrustMode(trustStatus: TrustStatus) {
    if (!walletAddress.trim()) {
      setMessage("Wallet address is required.");
      return;
    }

    storeWalletAddress(walletAddress);

    startTransition(async () => {
      const endpoint =
        trustStatus === "trusted" ? "/api/verify-world-id" : "/api/continue-unverified";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          trustStatus === "trusted"
            ? { walletAddress, worldNullifierHash: worldNullifierHash || `dev-${walletAddress}` }
            : { walletAddress }
        )
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to save player profile.");
        return;
      }

      setPlayer(payload.player);
      setMessage(
        trustStatus === "trusted"
          ? "Trusted player profile saved."
          : "Untrusted player profile saved."
      );
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Panel
        title="Identity Setup"
        description="For MVP this uses a wallet-address-first flow. Real wallet connection and World ID proof verification can replace the temporary input fields next."
      >
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white">Wallet address</span>
            <input
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              placeholder="0x1234..."
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-white">
              World nullifier hash
            </span>
            <input
              value={worldNullifierHash}
              onChange={(event) => setWorldNullifierHash(event.target.value)}
              placeholder="Temporary dev placeholder until real World ID wiring"
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => submitTrustMode("trusted")}
              disabled={isPending}
              className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-left transition hover:border-emerald-300/50 disabled:opacity-60"
            >
              <StatusBadge tone="trusted">Trusted</StatusBadge>
              <p className="mt-3 text-base font-medium">Verify with World ID 4.0</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Saves the player as trusted. Until real proof validation is wired, the nullifier field is a dev stand-in.
              </p>
            </button>

            <button
              type="button"
              onClick={() => submitTrustMode("untrusted")}
              disabled={isPending}
              className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-left transition hover:border-amber-300/50 disabled:opacity-60"
            >
              <StatusBadge tone="untrusted">Might Be A Sybil</StatusBadge>
              <p className="mt-3 text-base font-medium">Continue without verification</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Saves the player as untrusted. This is visibly treated differently in the UI.
              </p>
            </button>
          </div>
        </div>
      </Panel>

      <Panel
        title="Current Player State"
        description="This is the persisted state that the lobby and duel will rely on."
      >
        <div className="grid gap-3">
          <p className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </p>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            {player ? (
              <div className="grid gap-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Display</span>
                  <span className="font-medium text-white">
                    {player.ensName ?? player.displayName ?? player.walletAddress}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Wallet</span>
                  <span>{player.walletAddress}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Trust</span>
                  <StatusBadge tone={player.trustStatus}>
                    {player.trustStatus === "trusted" ? "Trusted" : "Might Be A Sybil"}
                  </StatusBadge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No player saved yet.</p>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
