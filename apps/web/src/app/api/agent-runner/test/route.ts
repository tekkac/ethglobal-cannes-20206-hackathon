import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/http/respond";
import { getRunnerByWallet, testRunner } from "@/lib/services/players";

const requestSchema = z.object({
  walletAddress: z.string().min(1),
});

async function pingRunner(endpointUrl: string, runnerToken: string): Promise<{ ok: boolean; message?: string; latencyMs: number }> {
  const url = `${endpointUrl.replace(/\/$/, "")}/turn`;
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${runnerToken}`,
      },
      body: JSON.stringify({
        type: "public_turn",
        matchId: "test-ping",
        seatLabel: "P1",
        turnIndex: 0,
        playerLabel: "Arena Test",
        opponentLabel: "Arena Test",
        trustStatus: "trusted",
        transcript: [],
      }),
      signal: AbortSignal.timeout(5000),
    });

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return { ok: false, message: `Runner responded with ${res.status}`, latencyMs };
    }

    const body = await res.json();

    if (!body.message || typeof body.message !== "string") {
      return { ok: false, message: "Runner responded but returned no message", latencyMs };
    }

    return { ok: true, message: body.message.slice(0, 120), latencyMs };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Could not reach runner: ${detail}`, latencyMs };
  }
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return badRequest("Invalid runner test payload", parsed.error.flatten());
  }

  const existing = getRunnerByWallet(parsed.data.walletAddress);

  if (!existing) {
    return badRequest("Runner must exist before testing");
  }

  if (!existing.endpointUrl) {
    return badRequest("Runner has no endpoint URL configured");
  }

  const ping = await pingRunner(existing.endpointUrl, existing.runnerToken);

  if (!ping.ok) {
    return NextResponse.json({
      ok: false,
      error: ping.message,
      latencyMs: ping.latencyMs,
      runner: existing,
    }, { status: 422 });
  }

  // Mark healthy only after real successful ping
  const runner = testRunner(parsed.data.walletAddress);

  return NextResponse.json({
    ok: true,
    runner,
    testResponse: ping.message,
    latencyMs: ping.latencyMs,
  });
}
