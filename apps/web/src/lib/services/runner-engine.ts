import { createHash } from "node:crypto";

import type { FinalAction, TrustStatus } from "@agent-duel/shared";

type RunnerTurnInput = {
  matchId: string;
  seatLabel: "P1" | "P2";
  turnIndex: number;
  runnerLabel: string;
  playerLabel: string;
  opponentLabel: string;
  trustStatus: TrustStatus;
  transcript: Array<{
    seatLabel: "P1" | "P2" | null;
    body: string;
  }>;
};

type RunnerFinalActionInput = {
  matchId: string;
  seatLabel: "P1" | "P2";
  runnerLabel: string;
  playerLabel: string;
  opponentLabel: string;
  trustStatus: TrustStatus;
  transcript: Array<{
    seatLabel: "P1" | "P2" | null;
    body: string;
  }>;
};

const toneOpeners = {
  trusted: [
    "I open on discipline.",
    "I answer on pattern, not panic.",
    "I keep the lane clean for the desk.",
  ],
  untrusted: [
    "I open under suspicion and lean into it.",
    "I answer with enough edge to keep the crowd guessing.",
    "I keep the transcript sharp because the badge already did the warning.",
  ],
} as const;

function deterministicChoice(seed: string, options: readonly string[]) {
  const digest = createHash("sha256").update(seed).digest("hex");
  const index = parseInt(digest.slice(0, 8), 16) % options.length;
  return options[index];
}

function buildContextLine(input: RunnerTurnInput) {
  const previous = input.transcript.at(-1);

  if (!previous) {
    return `Six public turns only, so ${input.playerLabel} needs signal immediately.`;
  }

  if (previous.seatLabel === input.seatLabel) {
    return `The previous visible line came from the same seat, so I need to sharpen the pattern without sounding repetitive.`;
  }

  return `I am answering ${input.opponentLabel}'s last visible move, so the arena should be able to read intent from the reply.`;
}

const turnClosers = [
  "The crowd should be able to justify the hidden phase from what they saw here.",
  "If commit turns violent later, this public line still needs to feel earned.",
  "I want replay viewers to see a strategy, not just a pose.",
];

export function generateRunnerPublicTurn(input: RunnerTurnInput) {
  const openerPool = toneOpeners[input.trustStatus];
  const opener = deterministicChoice(
    `${input.matchId}:${input.seatLabel}:${input.turnIndex}:${input.runnerLabel}:opener`,
    openerPool,
  );
  const closer = deterministicChoice(
    `${input.matchId}:${input.seatLabel}:${input.turnIndex}:${input.runnerLabel}:closer`,
    turnClosers,
  );
  const contextLine = buildContextLine(input);

  return `${input.runnerLabel} for ${input.playerLabel}: ${opener} ${contextLine} ${closer}`;
}

export function generateRunnerFinalAction(input: RunnerFinalActionInput): FinalAction {
  const transcriptSignal = input.transcript
    .map((entry) => entry.body)
    .join("|");
  const digest = createHash("sha256")
    .update(
      `${input.matchId}:${input.seatLabel}:${input.runnerLabel}:${input.playerLabel}:${input.opponentLabel}:${input.trustStatus}:${transcriptSignal}`,
    )
    .digest("hex");

  return parseInt(digest.slice(0, 2), 16) % 2 === 0 ? "SPLIT" : "STEAL";
}
