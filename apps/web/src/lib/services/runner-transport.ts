import type { FinalAction, TrustStatus } from "@agent-duel/shared";

import {
  generateRunnerFinalAction,
  generateRunnerPublicTurn,
} from "@/lib/services/runner-engine";

type RunnerRecord = {
  runnerLabel: string;
  mode: string;
  endpointUrl: string | null;
  runnerToken: string;
  status: string;
  lastSeenAt: string | null;
};

type TranscriptContext = Array<{
  seatLabel: "P1" | "P2" | null;
  body: string;
}>;

type PublicTurnInput = {
  matchId: string;
  seatLabel: "P1" | "P2";
  turnIndex: number;
  runner: RunnerRecord | null;
  playerLabel: string;
  opponentLabel: string;
  trustStatus: TrustStatus;
  transcript: TranscriptContext;
};

type FinalActionInput = {
  matchId: string;
  seatLabel: "P1" | "P2";
  runner: RunnerRecord | null;
  playerLabel: string;
  opponentLabel: string;
  trustStatus: TrustStatus;
  transcript: TranscriptContext;
};

function getRunnerLabel(runner: RunnerRecord | null, seatLabel: "P1" | "P2") {
  return runner?.runnerLabel ?? `Runner ${seatLabel}`;
}

async function callRemoteRunner<T>(
  runner: RunnerRecord,
  path: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  if (!runner.endpointUrl) {
    return null;
  }

  try {
    const response = await fetch(`${runner.endpointUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${runner.runnerToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function executePublicTurn(input: PublicTurnInput) {
  const runnerLabel = getRunnerLabel(input.runner, input.seatLabel);
  const remote = input.runner
    ? await callRemoteRunner<{ message?: string }>(input.runner, "/turn", {
        type: "public_turn",
        matchId: input.matchId,
        seatLabel: input.seatLabel,
        turnIndex: input.turnIndex,
        playerLabel: input.playerLabel,
        opponentLabel: input.opponentLabel,
        trustStatus: input.trustStatus,
        transcript: input.transcript,
      })
    : null;

  if (remote?.message?.trim()) {
    return remote.message.trim();
  }

  return generateRunnerPublicTurn({
    matchId: input.matchId,
    seatLabel: input.seatLabel,
    turnIndex: input.turnIndex,
    runnerLabel,
    playerLabel: input.playerLabel,
    opponentLabel: input.opponentLabel,
    trustStatus: input.trustStatus,
    transcript: input.transcript,
  });
}

export async function executeFinalAction(input: FinalActionInput): Promise<FinalAction> {
  const runnerLabel = getRunnerLabel(input.runner, input.seatLabel);
  const remote = input.runner
    ? await callRemoteRunner<{ action?: FinalAction }>(input.runner, "/final-action", {
        type: "final_action",
        matchId: input.matchId,
        seatLabel: input.seatLabel,
        playerLabel: input.playerLabel,
        opponentLabel: input.opponentLabel,
        trustStatus: input.trustStatus,
        transcript: input.transcript,
      })
    : null;

  if (remote?.action === "SPLIT" || remote?.action === "STEAL") {
    return remote.action;
  }

  return generateRunnerFinalAction({
    matchId: input.matchId,
    seatLabel: input.seatLabel,
    runnerLabel,
    playerLabel: input.playerLabel,
    opponentLabel: input.opponentLabel,
    trustStatus: input.trustStatus,
    transcript: input.transcript,
  });
}
