"use client";

import { useEffect, useState, useTransition } from "react";

import type { TrustStatus } from "@agent-duel/shared";

import {
  BroadcastMetric,
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
          description="For MVP this is still wallet-address-first, but the layout now treats trust mode as a public arena decision instead of a hidden checkbox."
        >
          <div className="grid gap-4">
            <div className="arena-surface border-cyan-400/20 bg-cyan-400/10 px-4 py-4 text-sm leading-6 text-cyan-50">
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
                  placeholder="Temporary dev placeholder until real World ID wiring"
                  className="arena-input"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <button
                type="button"
                onClick={() => submitTrustMode("trusted")}
                disabled={isPending}
                className="arena-surface border-emerald-400/20 bg-emerald-400/10 p-5 text-left transition hover:border-emerald-300/40"
              >
                <StatusBadge tone="trusted">Trusted lane</StatusBadge>
                <p className="mt-4 text-lg font-semibold text-white">Verify with World ID 4.0</p>
                <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">
                  Save the player as trusted. Once real proof validation lands, this stays the premium identity path.
                </p>
              </button>

              <button
                type="button"
                onClick={() => submitTrustMode("untrusted")}
                disabled={isPending}
                className="arena-surface border-amber-400/20 bg-[linear-gradient(180deg,rgba(243,166,63,0.18),rgba(255,118,93,0.08))] p-5 text-left transition hover:border-amber-300/40"
              >
                <StatusBadge tone="untrusted">Suspect lane</StatusBadge>
                <p className="mt-4 text-lg font-semibold text-white">Continue without verification</p>
                <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">
                  Save the player as untrusted. The copy and color treatment should make that visible without turning the UI into a warning screen.
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
                ? "Trusted saved"
                : trustChosen === "untrusted"
                  ? "Untrusted saved"
                  : "Pending selection"
            }
            tone={trustChosen ?? "neutral"}
          />
          <BroadcastMetric
            label="Lobby gate"
            value={trustChosen ? "Ready for runner setup" : "Blocked until chosen"}
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
              <h2 className="mt-3 text-2xl font-semibold text-white">Current player state</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">
                This card is the identity lane the lobby and duel will inherit.
              </p>
            </div>
            {player ? (
              <StatusBadge tone={player.trustStatus}>
                {player.trustStatus === "trusted" ? "Trusted entrant" : "Might be a sybil"}
              </StatusBadge>
            ) : null}
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(5,9,15,0.75))] p-5">
            {player ? (
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="arena-kicker text-[var(--arena-copy-muted)]">Display</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{playerName}</p>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.28em] text-[var(--arena-copy-muted)]">
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
                      {player.trustStatus === "trusted" ? "Trusted" : "Might be a sybil"}
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
          eyebrow="Arena desk preview"
          title="Identity choice gets narrated like match state"
          description="Even the onboarding route should feel connected to the live duel. The copy below previews how identity status will read once the player enters the lobby."
          turns={[
            {
              marker: "Pre-flight",
              speaker: "Arena desk",
              text: walletAddress
                ? "Wallet signal received. The desk is waiting on trust mode before the lane can go live."
                : "No wallet signal yet. Arena entry is still locked.",
              tone: "system",
            },
            {
              marker: "Identity lane",
              speaker: "Player 1",
              text:
                trustChosen === "trusted"
                  ? `${playerName} enters the trusted lane. The badge will stay visible on every lobby and match surface.`
                  : `${playerName} can still enter untrusted. The UI keeps the warning visible without hiding the player.`,
              tone: "p1",
            },
            {
              marker: "Queue rule",
              speaker: "Arena desk",
              text: "No lobby access until the product knows which trust lane to present for this contestant.",
              tone: "system",
            },
          ]}
        />
      </div>
    </div>
  );
}
