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
          description="The MVP flow stays the same, but the page now presents the runner as live arena equipment instead of admin infrastructure."
        >
          <div className="grid gap-4">
            <div className="arena-surface border-cyan-400/20 bg-cyan-400/10 px-4 py-4 text-sm leading-6 text-cyan-50">
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
                placeholder="Optional in MVP"
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
            value={runnerToken ? "Issued or loaded" : "Not issued"}
            tone={runnerToken ? "info" : "neutral"}
          />
          <BroadcastMetric
            label="Relay mode"
            value={mode === "local" ? "Local runner" : "Self-hosted runner"}
            tone="neutral"
          />
          <BroadcastMetric
            label="Health gate"
            value={runner?.status === "healthy" ? "Lobby unlocked" : "Lobby blocked"}
            tone={runner?.status === "healthy" ? "trusted" : "untrusted"}
          />
        </div>
      </div>

      <div className="grid gap-6">
        <section className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="arena-kicker text-[var(--arena-gold)]">Relay telemetry</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Runner state</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">
                This is the server-side runner record that decides whether a contestant can reach the lobby.
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
                <div className="arena-surface flex items-center justify-between gap-3 px-4 py-3 text-sm text-[var(--arena-copy)]">
                  <span className="text-[var(--arena-copy-muted)]">Label</span>
                  <span className="font-medium text-white">{runner.runnerLabel}</span>
                </div>
                <div className="arena-surface flex items-center justify-between gap-3 px-4 py-3 text-sm text-[var(--arena-copy)]">
                  <span className="text-[var(--arena-copy-muted)]">Mode</span>
                  <span className="font-medium text-white">{runner.mode}</span>
                </div>
                <div className="arena-surface flex items-center justify-between gap-3 px-4 py-3 text-sm text-[var(--arena-copy)]">
                  <span className="text-[var(--arena-copy-muted)]">Last seen</span>
                  <span className="font-medium text-white">{runner.lastSeenAt ?? "Pending first ping"}</span>
                </div>
                <div className="arena-surface grid gap-2 px-4 py-3 text-sm text-[var(--arena-copy)]">
                  <span className="text-[var(--arena-copy-muted)]">Token</span>
                  <code className="overflow-x-auto rounded-xl bg-black/30 px-3 py-3 text-xs text-cyan-50">
                    {runner.runnerToken}
                  </code>
                </div>
              </>
            ) : (
              <div className="arena-surface px-4 py-4 text-sm leading-6 text-[var(--arena-copy-muted)]">
                No runner registered yet. Issue a token first so the contestant has a relay identity.
              </div>
            )}
          </div>
        </section>

        <TranscriptPreview
          eyebrow="Relay commentary"
          title="Runner setup reads like a pre-match systems check"
          description="This page keeps the live-arena voice. Token issuance, registration, and health checks are narrated as broadcast events so the transition into the lobby feels natural."
          turns={[
            {
              marker: "Token issue",
              speaker: "Arena desk",
              text: runnerToken
                ? "Relay key generated. The contestant can now bind a runner to the arena."
                : "No relay key yet. Generate one before any runner can announce itself.",
              tone: "system",
            },
            {
              marker: "Runner lane",
              speaker: "Player 1",
              text:
                runner?.status === "healthy"
                  ? `${runner.runnerLabel} is healthy and ready to answer when the duel goes live.`
                  : "The arena is still waiting for a healthy runner response from the contestant lane.",
              tone: "p1",
            },
            {
              marker: "Queue gate",
              speaker: "Arena desk",
              text: "A player cannot enter the lobby until this relay is healthy. The restriction is product logic, not just decorative copy.",
              tone: "system",
            },
          ]}
        />
      </div>
    </div>
  );
}
