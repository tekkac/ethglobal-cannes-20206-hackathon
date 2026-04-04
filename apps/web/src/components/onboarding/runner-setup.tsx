"use client";

import { useEffect, useState, useTransition } from "react";

import {
  BroadcastMetric,
  TranscriptPreview,
} from "@/components/ui/arena-primitives";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { loadStoredWalletAddress, storeWalletAddress } from "@/lib/client/session";

type RunnerRecord = {
  runnerLabel: string;
  mode: string;
  endpointUrl: string | null;
  runnerToken: string;
  status: string;
  lastSeenAt: string | null;
};

export function RunnerSetup() {
  const [walletAddress, setWalletAddress] = useState(() => loadStoredWalletAddress());
  const [runnerLabel, setRunnerLabel] = useState("Local Runner");
  const [mode, setMode] = useState("local");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [runnerToken, setRunnerToken] = useState("");
  const [runner, setRunner] = useState<RunnerRecord | null>(null);
  const [message, setMessage] = useState("Issue a runner token, register the runner, then test it.");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/me?walletAddress=${encodeURIComponent(walletAddress)}`);
      const payload = await response.json();
      setRunner(payload.runner);
      if (payload.runner?.runnerToken) {
        setRunnerToken(payload.runner.runnerToken);
      }
    });
  }, [walletAddress]);

  function issueRunnerToken() {
    if (!walletAddress.trim()) {
      setMessage("Wallet address is required.");
      return;
    }

    storeWalletAddress(walletAddress);

    startTransition(async () => {
      const response = await fetch("/api/agent-runner/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to issue runner token.");
        return;
      }

      setRunnerToken(payload.runnerToken);
      setMessage("Runner token issued. Register the runner next.");
    });
  }

  function registerRunner() {
    if (!walletAddress.trim() || !runnerLabel.trim() || !runnerToken.trim()) {
      setMessage("Wallet address, runner label, and runner token are required.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/agent-runner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          runnerLabel,
          mode,
          endpointUrl: endpointUrl || undefined,
          runnerToken,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to register runner.");
        return;
      }

      setRunner(payload.runner);
      setMessage("Runner registered.");
    });
  }

  function testRunner() {
    if (!walletAddress.trim()) {
      setMessage("Wallet address is required.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/agent-runner/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to test runner.");
        return;
      }

      setRunner(payload.runner);
      setMessage(`Runner status is now ${payload.runner.status}.`);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <div className="grid gap-6">
        <Panel
          title="Runner Relay"
          description="Wake the bot up, wire the relay, and make sure it answers when the lights hit."
        >
          <div className="grid gap-4">
            <div className="rounded-[1.6rem] border-2 border-[#123f75]/14 bg-[linear-gradient(180deg,#93e5ff,#57c8ff)] px-4 py-4 text-sm font-semibold leading-6 text-[#113b70] shadow-[0_8px_0_#1d92ca,0_16px_24px_rgba(29,146,202,0.18)]">
              {message}
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Wallet address</span>
              <input
                value={walletAddress}
                onChange={(event) => setWalletAddress(event.target.value)}
                placeholder="0x1234..."
                className="arena-input"
              />
            </label>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-white">Runner token</span>
                <input
                  value={runnerToken}
                  onChange={(event) => setRunnerToken(event.target.value)}
                  placeholder="runner_..."
                  className="arena-input"
                />
              </label>
              <button
                type="button"
                onClick={issueRunnerToken}
                disabled={isPending}
                className="arena-button-primary self-end"
              >
                Issue token
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-white">Runner label</span>
                <input
                  value={runnerLabel}
                  onChange={(event) => setRunnerLabel(event.target.value)}
                  className="arena-input"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-white">Mode</span>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value)}
                  className="arena-select"
                >
                  <option value="local">Local</option>
                  <option value="self-hosted">Self-hosted</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Endpoint URL</span>
              <input
                value={endpointUrl}
                onChange={(event) => setEndpointUrl(event.target.value)}
                placeholder="Relay endpoint"
                className="arena-input"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={registerRunner}
                disabled={isPending}
                className="arena-button-secondary"
              >
                Register runner
              </button>
              <button
                type="button"
                onClick={testRunner}
                disabled={isPending}
                className="arena-button-secondary"
              >
                Test runner
              </button>
            </div>
          </div>
        </Panel>

        <div className="grid gap-3 md:grid-cols-3">
          <BroadcastMetric
            label="Token status"
            value={runnerToken ? "Loaded" : "Missing"}
            tone={runnerToken ? "info" : "neutral"}
          />
          <BroadcastMetric
            label="Relay mode"
            value={mode === "local" ? "Local bot" : "Remote bot"}
            tone="neutral"
          />
          <BroadcastMetric
            label="Health gate"
            value={runner?.status === "healthy" ? "Fight-ready" : "Still cold"}
            tone={runner?.status === "healthy" ? "trusted" : "untrusted"}
          />
        </div>
      </div>

      <div className="grid gap-6">
        <section className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="arena-kicker text-[var(--arena-gold)]">Relay telemetry</p>
              <h2 className="mt-3 text-2xl font-black text-white">Runner state</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">
                If this bot is not alive, the lane is not entering the fight.
              </p>
            </div>
            {runner ? (
              <StatusBadge tone={runner.status === "healthy" ? "trusted" : "info"}>
                {runner.status}
              </StatusBadge>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3">
            {runner ? (
              <>
                <div className="rounded-[1.5rem] border-2 border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-[var(--arena-copy)] shadow-[0_10px_16px_rgba(10,19,38,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--arena-copy-muted)]">Label</span>
                  <span className="font-medium text-white">{runner.runnerLabel}</span>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border-2 border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-[var(--arena-copy)] shadow-[0_10px_16px_rgba(10,19,38,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--arena-copy-muted)]">Mode</span>
                  <span className="font-medium text-white">{runner.mode}</span>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border-2 border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-[var(--arena-copy)] shadow-[0_10px_16px_rgba(10,19,38,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--arena-copy-muted)]">Last seen</span>
                  <span className="font-medium text-white">{runner.lastSeenAt ?? "Pending first ping"}</span>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border-2 border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-[var(--arena-copy)] shadow-[0_10px_16px_rgba(10,19,38,0.12)]">
                  <span className="text-[var(--arena-copy-muted)]">Token</span>
                  <code className="overflow-x-auto rounded-[1rem] border border-white/10 bg-[rgba(17,35,71,0.48)] px-3 py-3 text-xs text-cyan-50">
                    {runner.runnerToken}
                  </code>
                </div>
              </>
            ) : (
              <div className="arena-surface px-4 py-4 text-sm leading-6 text-[var(--arena-copy-muted)]">
                No bot online yet. Cut a token and wake it up.
              </div>
            )}
          </div>
        </section>

        <TranscriptPreview
          eyebrow="Systems check"
          title="The bot bay should feel dangerous, not technical"
          description="This is where your lane gets armed."
          turns={[
            {
              marker: "Token issue",
              speaker: "Arena desk",
              text: runnerToken
                ? "Key cut. The bot can bind to the lane."
                : "No key. No bot. No fight.",
              tone: "system",
            },
            {
              marker: "Runner lane",
              speaker: "Player 1",
              text:
                runner?.status === "healthy"
                  ? `${runner.runnerLabel} is hot and ready to talk back.`
                  : "The lane is still waiting for a live response.",
              tone: "p1",
            },
            {
              marker: "Queue gate",
              speaker: "Arena desk",
              text: "Cold bots stay out of the queue.",
              tone: "system",
            },
          ]}
        />
      </div>
    </div>
  );
}
