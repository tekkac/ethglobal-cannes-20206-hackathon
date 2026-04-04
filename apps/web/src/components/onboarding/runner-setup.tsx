"use client";

import { useEffect, useState, useTransition } from "react";

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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ walletAddress })
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          walletAddress,
          runnerLabel,
          mode,
          endpointUrl: endpointUrl || undefined,
          runnerToken
        })
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ walletAddress })
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
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel
        title="Runner Setup"
        description="This is the real MVP flow: issue a token, wire it into a local or self-hosted runner, then test the runner from the arena."
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

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Runner token</span>
              <input
                value={runnerToken}
                onChange={(event) => setRunnerToken(event.target.value)}
                placeholder="runner_..."
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
              />
            </label>
            <button
              type="button"
              onClick={issueRunnerToken}
              disabled={isPending}
              className="self-end rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/60 disabled:opacity-60"
            >
              Issue token
            </button>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-white">Runner label</span>
            <input
              value={runnerLabel}
              onChange={(event) => setRunnerLabel(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Mode</span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
              >
                <option value="local">Local</option>
                <option value="self-hosted">Self-hosted</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Endpoint URL</span>
              <input
                value={endpointUrl}
                onChange={(event) => setEndpointUrl(event.target.value)}
                placeholder="Optional in MVP"
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={registerRunner}
              disabled={isPending}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-300/50 disabled:opacity-60"
            >
              Register runner
            </button>
            <button
              type="button"
              onClick={testRunner}
              disabled={isPending}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-300/50 disabled:opacity-60"
            >
              Test runner
            </button>
          </div>
        </div>
      </Panel>

      <Panel
        title="Runner State"
        description="This is the server-side state that will block or allow lobby entry."
      >
        <div className="grid gap-3">
          <p className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </p>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            {runner ? (
              <div className="grid gap-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Label</span>
                  <span className="font-medium text-white">{runner.runnerLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Mode</span>
                  <span>{runner.mode}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Status</span>
                  <StatusBadge tone={runner.status === "healthy" ? "trusted" : "info"}>
                    {runner.status}
                  </StatusBadge>
                </div>
                <div className="grid gap-2">
                  <span className="text-slate-400">Token</span>
                  <code className="overflow-x-auto rounded-xl bg-slate-900 px-3 py-2 text-xs text-cyan-100">
                    {runner.runnerToken}
                  </code>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No runner registered yet.</p>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
