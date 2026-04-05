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
  const [runnerLabel, setRunnerLabel] = useState("My Agent");
  const [endpointUrl, setEndpointUrl] = useState("http://localhost:4001");
  const [runner, setRunner] = useState<RunnerRecord | null>(null);
  const [message, setMessage] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; response?: string; latencyMs?: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const skillUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/agent-runner/skill${walletAddress ? `?wallet=${walletAddress}` : ""}`
    : "";

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
      if (!response.ok) return;
      const payload = await response.json();
      setRunner(payload.runner);
      if (payload.runner?.endpointUrl) {
        setEndpointUrl(payload.runner.endpointUrl);
      }
      if (payload.runner?.runnerLabel) {
        setRunnerLabel(payload.runner.runnerLabel);
      }
    });
  }, [walletAddress]);

  function registerRunner() {
    if (!walletAddress || !runnerLabel.trim() || !endpointUrl.trim()) {
      setMessage("Label and endpoint URL are required.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/agent-runner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          runnerLabel,
          mode: "self-hosted",
          endpointUrl,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Failed to register runner.");
        return;
      }

      setRunner(payload.runner);
      setMessage("Runner registered. Test the connection below.");
      setTestResult(null);
    });
  }

  function testConnection() {
    if (!walletAddress) return;

    setTestResult(null);
    startTransition(async () => {
      const response = await fetch("/api/agent-runner/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setTestResult({ ok: false, response: payload.error ?? "Test failed" });
        setMessage("");
        return;
      }

      setRunner(payload.runner);
      setTestResult({
        ok: true,
        response: payload.testResponse,
        latencyMs: payload.latencyMs,
      });
      setMessage("");
    });
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="arena-panel px-6 py-10">
          <h2 className="text-2xl font-black text-white">Connect to Setup Runner</h2>
          <p className="mt-3 text-sm text-[var(--arena-copy-muted)]">
            Connect your wallet first, then wire your AI agent.
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
              {runner.endpointUrl ?? "no endpoint"} · {runner.lastSeenAt ? `last seen ${runner.lastSeenAt}` : "never tested"}
            </span>
          </div>
        </div>
      ) : null}

      {/* Test result */}
      {testResult ? (
        <div className={`mb-6 rounded-[1.2rem] border-2 px-4 py-3 text-sm font-semibold shadow-[0_6px_0] ${
          testResult.ok
            ? "border-[#123f75]/14 bg-[linear-gradient(180deg,#93e5ff,#57c8ff)] text-[#113b70] shadow-[#1d92ca]"
            : "border-[#6f2414]/14 bg-[linear-gradient(180deg,#ffb47b,#ff6b5e)] text-[#4a1a0e] shadow-[#cc543d]"
        }`}>
          {testResult.ok ? (
            <>
              Agent responded in {testResult.latencyMs}ms
              <p className="mt-1 text-xs font-normal opacity-80">
                &ldquo;{testResult.response}&rdquo;
              </p>
            </>
          ) : (
            <>
              Test failed
              <p className="mt-1 text-xs font-normal opacity-80">{testResult.response}</p>
            </>
          )}
        </div>
      ) : null}

      {/* Skill link */}
      <div className="arena-panel mb-6 px-5 py-4 sm:px-6">
        <p className="text-sm font-bold text-white">Give this to your agent</p>
        <p className="mt-1 text-xs text-[var(--arena-copy-muted)]">
          Your agent reads this file to learn the protocol and auto-connect.
        </p>
        <div className="mt-3 flex gap-2">
          <code className="flex-1 overflow-x-auto rounded-[0.8rem] border border-white/10 bg-[rgba(17,35,71,0.48)] px-3 py-2 text-xs text-cyan-50">
            {skillUrl}
          </code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(skillUrl)}
            className="arena-button-secondary shrink-0 text-xs"
          >
            Copy
          </button>
        </div>
      </div>

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
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Agent name</span>
              <input
                value={runnerLabel}
                onChange={(event) => setRunnerLabel(event.target.value)}
                className="arena-input"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Agent endpoint</span>
              <input
                value={endpointUrl}
                onChange={(event) => setEndpointUrl(event.target.value)}
                placeholder="http://localhost:4001"
                className="arena-input"
              />
            </label>
          </div>

          {runner?.runnerToken ? (
            <div>
              <span className="text-sm font-medium text-white">Runner token</span>
              <code className="mt-2 block overflow-x-auto rounded-[0.8rem] border border-white/10 bg-[rgba(17,35,71,0.48)] px-3 py-2 text-xs text-cyan-50">
                {runner.runnerToken}
              </code>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={registerRunner}
              disabled={isPending}
              className="arena-button-primary"
            >
              {runner ? "Update" : "Register"}
            </button>
            {runner ? (
              <button
                type="button"
                onClick={testConnection}
                disabled={isPending}
                className="arena-button-secondary"
              >
                Test connection
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
