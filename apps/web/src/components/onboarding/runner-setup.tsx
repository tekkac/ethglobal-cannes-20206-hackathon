"use client";

import { useEffect, useState, useTransition } from "react";
import { useAccount } from "wagmi";

import { ArenaConnectButton } from "@/components/wallet/connect-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { storeWalletAddress } from "@/lib/client/session";

type RunnerRecord = {
  runnerLabel: string;
  mode: string;
  endpointUrl: string | null;
  runnerToken: string;
  status: string;
  lastSeenAt: string | null;
};

export function RunnerSetup() {
  const { address, isConnected } = useAccount();
  const walletAddress = address ?? "";
  const [runnerLabel, setRunnerLabel] = useState("Local Runner");
  const [mode, setMode] = useState("local");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [runnerToken, setRunnerToken] = useState("");
  const [runner, setRunner] = useState<RunnerRecord | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (walletAddress) storeWalletAddress(walletAddress);
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) {
      setRunner(null);
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
    if (!walletAddress) return;

    startTransition(async () => {
      const response = await fetch("/api/agent-runner/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to issue token.");
        return;
      }

      setRunnerToken(payload.runnerToken);
      setMessage("Token issued.");
    });
  }

  function registerRunner() {
    if (!walletAddress || !runnerLabel.trim() || !runnerToken.trim()) {
      setMessage("Label and token are required.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/agent-runner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    if (!walletAddress) return;

    startTransition(async () => {
      const response = await fetch("/api/agent-runner/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Test failed.");
        return;
      }

      setRunner(payload.runner);
      setMessage(`Runner status: ${payload.runner.status}`);
    });
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="arena-panel px-6 py-10">
          <h2 className="text-2xl font-black text-white">Connect to Setup Runner</h2>
          <p className="mt-3 text-sm text-[var(--arena-copy-muted)]">
            Connect your wallet first, then wire your bot.
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
      {/* Runner status bar */}
      {runner ? (
        <div className="arena-panel mb-6 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-white">{runner.runnerLabel}</span>
              <StatusBadge tone={runner.status === "healthy" ? "trusted" : "untrusted"}>
                {runner.status}
              </StatusBadge>
            </div>
            <span className="text-xs text-[var(--arena-copy-muted)]">
              {runner.mode} · {runner.lastSeenAt ?? "No ping yet"}
            </span>
          </div>
          {runner.runnerToken ? (
            <code className="mt-3 block overflow-x-auto rounded-[0.8rem] border border-white/10 bg-[rgba(17,35,71,0.48)] px-3 py-2 text-xs text-cyan-50">
              {runner.runnerToken}
            </code>
          ) : null}
        </div>
      ) : null}

      {/* Setup form */}
      <div className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
        {message ? (
          <div className="mb-4 rounded-[1.2rem] border-2 border-[#123f75]/14 bg-[linear-gradient(180deg,#93e5ff,#57c8ff)] px-4 py-3 text-sm font-semibold text-[#113b70] shadow-[0_6px_0_#1d92ca]">
            {message}
          </div>
        ) : null}

        <p className="mb-4 text-sm text-[var(--arena-copy-muted)]">
          Wallet: <span className="font-mono text-white">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
        </p>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
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

          <div className="grid gap-4 sm:grid-cols-2">
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

          {mode === "self-hosted" ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Endpoint URL</span>
              <input
                value={endpointUrl}
                onChange={(event) => setEndpointUrl(event.target.value)}
                placeholder="https://..."
                className="arena-input"
              />
            </label>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={registerRunner}
              disabled={isPending}
              className="arena-button-secondary"
            >
              Register
            </button>
            <button
              type="button"
              onClick={testRunner}
              disabled={isPending}
              className="arena-button-secondary"
            >
              Test connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
