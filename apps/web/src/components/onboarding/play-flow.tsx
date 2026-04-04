"use client";

import { useEffect, useState, useTransition } from "react";

import type { TrustStatus } from "@agent-duel/shared";

import {
  BroadcastMetric,
  IdentityAvatar,
  TranscriptPreview,
} from "@/components/ui/arena-primitives";
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
  const playerName = player?.ensName ?? player?.displayName ?? player?.walletAddress ?? "No contestant yet";
  const trustChosen = player?.trustStatus ?? null;

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
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          trustStatus === "trusted"
            ? { walletAddress, worldNullifierHash: worldNullifierHash || `dev-${walletAddress}` }
            : { walletAddress },
        ),
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
          : "Untrusted player profile saved.",
      );
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="grid gap-6">
        <Panel
          title="Identity Desk"
          description="Pick the way you enter. The room should know your lane the second you lock in."
        >
          <div className="grid gap-4">
            <div className="rounded-[1.6rem] border-2 border-[#123f75]/14 bg-[linear-gradient(180deg,#93e5ff,#57c8ff)] px-4 py-4 text-sm font-semibold leading-6 text-[#113b70] shadow-[0_8px_0_#1d92ca,0_16px_24px_rgba(29,146,202,0.18)]">
              {message}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-white">Wallet address</span>
                <input
                  value={walletAddress}
                  onChange={(event) => setWalletAddress(event.target.value)}
                  placeholder="0x1234..."
                  className="arena-input"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-white">World nullifier hash</span>
                <input
                  value={worldNullifierHash}
                  onChange={(event) => setWorldNullifierHash(event.target.value)}
                  placeholder="Arena passcode"
                  className="arena-input"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <button
                type="button"
                onClick={() => submitTrustMode("trusted")}
                disabled={isPending}
                className="rounded-[1.8rem] border-2 border-[#0f3d72]/14 bg-[linear-gradient(180deg,rgba(134,235,196,0.3),rgba(76,171,135,0.12))] p-5 text-left shadow-[0_10px_20px_rgba(10,19,38,0.14)] transition hover:-translate-y-0.5"
              >
                <StatusBadge tone="trusted">Prime lane</StatusBadge>
                <p className="mt-4 text-xl font-black text-white">Enter the clean lane</p>
                <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">
                  Sharp entrance. Cleaner aura. No mystery about who just stepped in.
                </p>
              </button>

              <button
                type="button"
                onClick={() => submitTrustMode("untrusted")}
                disabled={isPending}
                className="rounded-[1.8rem] border-2 border-[#6f2414]/14 bg-[linear-gradient(180deg,rgba(255,180,123,0.3),rgba(255,107,94,0.12))] p-5 text-left shadow-[0_10px_20px_rgba(10,19,38,0.14)] transition hover:-translate-y-0.5"
              >
                <StatusBadge tone="untrusted">Wildcard lane</StatusBadge>
                <p className="mt-4 text-xl font-black text-white">Enter as a wildcard</p>
                <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">
                  Same spotlight. Rougher aura. More danger in the read.
                </p>
              </button>
            </div>
          </div>
        </Panel>

        <div className="grid gap-3 md:grid-cols-3">
          <BroadcastMetric
            label="Wallet state"
            value={walletAddress ? "Connected locally" : "Not loaded"}
            tone={walletAddress ? "info" : "neutral"}
          />
          <BroadcastMetric
            label="Trust choice"
            value={
              trustChosen === "trusted"
                ? "Prime lane locked"
                : trustChosen === "untrusted"
                  ? "Wildcard locked"
                  : "Pick a lane"
            }
            tone={trustChosen ?? "neutral"}
          />
          <BroadcastMetric
            label="Lobby gate"
            value={trustChosen ? "Bot tuning unlocked" : "Locked"}
            tone={trustChosen ? "trusted" : "neutral"}
          />
        </div>
      </div>

      <div className="grid gap-6">
        <section
          className={`arena-panel px-5 py-5 sm:px-6 sm:py-6 ${
            player?.trustStatus === "trusted"
              ? "border-emerald-400/20"
              : player?.trustStatus === "untrusted"
                ? "border-amber-400/20"
                : ""
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="arena-kicker text-[var(--arena-gold)]">Contestant preview</p>
              <h2 className="mt-3 text-2xl font-black text-white">Current player state</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">
                This is the face the arena sees.
              </p>
            </div>
            {player ? (
              <StatusBadge tone={player.trustStatus}>
                {player.trustStatus === "trusted" ? "Prime contender" : "Wildcard contender"}
              </StatusBadge>
            ) : null}
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(5,9,15,0.75))] p-5">
            {player ? (
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <IdentityAvatar
                      label={playerName}
                      avatarUrl={player.ensAvatar}
                      trustStatus={player.trustStatus}
                      size="lg"
                    />
                    <div>
                      <p className="arena-kicker text-[var(--arena-copy-muted)]">Display</p>
                      <p className="mt-2 text-2xl font-black text-white">{playerName}</p>
                    </div>
                  </div>
                  <div className="rounded-[999px] border border-white/10 bg-white/[0.08] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--arena-copy-muted)]">
                    Persisted profile
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-[var(--arena-copy)]">
                  <div className="arena-surface flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-[var(--arena-copy-muted)]">Wallet</span>
                    <span className="font-medium text-white">{player.walletAddress}</span>
                  </div>
                  <div className="arena-surface flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-[var(--arena-copy-muted)]">Trust</span>
                    <StatusBadge tone={player.trustStatus}>
                      {player.trustStatus === "trusted" ? "Prime lane" : "Wildcard lane"}
                    </StatusBadge>
                  </div>
                  <div className="arena-surface flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-[var(--arena-copy-muted)]">World nullifier</span>
                    <span className="font-medium text-white">
                      {player.worldNullifierHash ? "Saved" : "Not set"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--arena-copy-muted)]">
                No player saved yet. Choose a trust lane to generate the contestant profile.
              </p>
            )}
          </div>
        </section>

        <TranscriptPreview
          eyebrow="Entrance cut"
          title="Your entrance should already feel like part of the show"
          description="Before the duel starts, the room should already know your vibe."
          turns={[
            {
              marker: "Pre-flight",
              speaker: "Arena desk",
              text: walletAddress
                ? "Signal found. Pick the lane and step in."
                : "No signal yet. The gate stays shut.",
              tone: "system",
            },
            {
              marker: "Identity lane",
              speaker: "Player 1",
              text:
                trustChosen === "trusted"
                  ? `${playerName} walks in clean and fully lit.`
                  : `${playerName} walks in as a wildcard and owns the tension.`,
              tone: "p1",
            },
            {
              marker: "Queue rule",
              speaker: "Arena desk",
              text: "No duel without an entrance. Pick the lane, then load the bot.",
              tone: "system",
            },
          ]}
        />
      </div>
    </div>
  );
}
