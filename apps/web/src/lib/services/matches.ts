import { randomUUID } from "node:crypto";

import type { FinalAction, MatchStatus, TrustStatus } from "@agent-duel/shared";

import { dbAll, dbBatch, dbGet, dbRun } from "@/lib/db/store";
import { createCommitment, verifyCommitment } from "@/lib/services/commit-reveal";
import { getPlayerByWallet, getRunnerByWallet } from "@/lib/services/players";
import {
  executeFinalAction,
  executePublicTurn,
} from "@/lib/services/runner-transport";

type MatchPhase =
  | "waiting_to_start"
  | "live_round_1"
  | "live_round_2"
  | "live_round_3"
  | "live_round_4"
  | "live_round_5"
  | "live_round_6"
  | "awaiting_commits"
  | "awaiting_reveals"
  | "resolved";

type MatchRow = {
  id: string;
  stake_amount: string;
  status: MatchStatus;
  phase: MatchPhase | "draft";
  player_a_wallet: string;
  player_b_wallet: string | null;
  player_a_seat: "P1" | "P2" | null;
  player_b_seat: "P1" | "P2" | null;
  watcher_count: number;
  live_started_at: string | null;
  resolved_at: string | null;
  player_one_commitment: string | null;
  player_two_commitment: string | null;
  player_one_commit_secret: string | null;
  player_two_commit_secret: string | null;
  player_one_committed_action: FinalAction | null;
  player_two_committed_action: FinalAction | null;
  player_one_final_action: FinalAction | null;
  player_two_final_action: FinalAction | null;
  commit_verified_at: string | null;
  reveal_verification_error: string | null;
  settlement_status: "pending" | "claimable" | "settled" | null;
  player_one_payout: string | null;
  player_two_payout: string | null;
  player_one_claimed_at: string | null;
  player_two_claimed_at: string | null;
  resolution_summary: string | null;
};

type TranscriptRow = {
  id: string;
  match_id: string;
  phase: MatchPhase;
  turn_index: number;
  speaker_role: "player" | "system";
  speaker_label: string;
  seat_label: "P1" | "P2" | null;
  body: string;
  created_at: string;
};

type CreateMatchInput = {
  walletAddress: string;
  stakeAmount: string;
};

type MatchPlayerCard = {
  walletAddress: string;
  trustStatus: TrustStatus;
  displayName: string | null;
  ensName: string | null;
  ensAvatar: string | null;
};

type RecentMatchListItem = {
  id: string;
  stakeAmount: string;
  status: MatchStatus;
  phase: MatchPhase | "awaiting_opponent";
  resolvedAt: string | null;
  resolutionSummary: string | null;
  winningSeat: "P1" | "P2" | "draw" | null;
  playerOne: MatchPlayerCard | null;
  playerTwo: MatchPlayerCard | null;
  settlement: {
    status: "pending" | "claimable" | "settled";
    playerOnePayout: string;
    playerTwoPayout: string;
    playerOneClaimed: boolean;
    playerTwoClaimed: boolean;
  };
};

type MatchSnapshot = {
  id: string;
  stakeAmount: string;
  status: MatchStatus;
  phase: MatchPhase | "awaiting_opponent";
  phaseLabel: string;
  phaseIndex: number;
  totalPhases: number;
  watcherCount: number;
  timerLabel: string;
  readyToWatch: boolean;
  resolutionSummary: string | null;
  commitmentState: {
    playerOneCommitted: boolean;
    playerTwoCommitted: boolean;
    revealVerified: boolean;
    verificationError: string | null;
  };
  finalActions: {
    playerOne: FinalAction | null;
    playerTwo: FinalAction | null;
  };
  settlement: {
    status: "pending" | "claimable" | "settled";
    playerOnePayout: string;
    playerTwoPayout: string;
    playerOneClaimed: boolean;
    playerTwoClaimed: boolean;
  };
  playerA: MatchPlayerCard | null;
  playerB: MatchPlayerCard | null;
  playerOne: MatchPlayerCard | null;
  playerTwo: MatchPlayerCard | null;
  transcript: Array<{
    id: string;
    phase: MatchPhase;
    turnIndex: number;
    speakerRole: "player" | "system";
    speakerLabel: string;
    seatLabel: "P1" | "P2" | null;
    body: string;
    tone: "p1" | "p2" | "system";
  }>;
};

type MatchScriptEntry = {
  phase: MatchPhase;
  turnIndex: number;
  speakerRole: "player" | "system";
  speakerLabel: string;
  seatLabel: "P1" | "P2" | null;
  body: string;
};

const phaseMoments: Array<{
  phase: MatchPhase;
  label: string;
  durationMs: number;
  visibleTurns: number;
}> = [
  { phase: "waiting_to_start", label: "Waiting to start", durationMs: 3_000, visibleTurns: 0 },
  { phase: "live_round_1", label: "Round 1", durationMs: 4_000, visibleTurns: 1 },
  { phase: "live_round_2", label: "Round 2", durationMs: 4_000, visibleTurns: 2 },
  { phase: "live_round_3", label: "Round 3", durationMs: 4_000, visibleTurns: 3 },
  { phase: "live_round_4", label: "Round 4", durationMs: 4_000, visibleTurns: 4 },
  { phase: "live_round_5", label: "Round 5", durationMs: 4_000, visibleTurns: 5 },
  { phase: "live_round_6", label: "Round 6", durationMs: 4_000, visibleTurns: 6 },
  { phase: "awaiting_commits", label: "Final commit", durationMs: 3_000, visibleTurns: 7 },
  { phase: "awaiting_reveals", label: "Final reveal", durationMs: 3_000, visibleTurns: 8 },
  { phase: "resolved", label: "Resolved", durationMs: Number.POSITIVE_INFINITY, visibleTurns: 9 },
];

const MATCH_COLUMNS = `id, stake_amount, status, phase, player_a_wallet, player_b_wallet, player_a_seat,
  player_b_seat, watcher_count, live_started_at, resolved_at,
  player_one_commitment, player_two_commitment, player_one_commit_secret,
  player_two_commit_secret, player_one_committed_action, player_two_committed_action,
  player_one_final_action, player_two_final_action, commit_verified_at,
  reveal_verification_error, settlement_status, player_one_payout, player_two_payout,
  player_one_claimed_at, player_two_claimed_at, resolution_summary`;

function normalizeWalletAddress(walletAddress: string) {
  return walletAddress.trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

async function buildPlayerCard(walletAddress: string | null): Promise<MatchPlayerCard | null> {
  if (!walletAddress) {
    return null;
  }

  const player = await getPlayerByWallet(walletAddress);

  if (!player) {
    return null;
  }

  return {
    walletAddress: player.walletAddress,
    trustStatus: player.trustStatus as TrustStatus,
    displayName: player.displayName,
    ensName: player.ensName,
    ensAvatar: player.ensAvatar,
  };
}

function formatPlayerLabel(player: MatchPlayerCard | null, seatLabel: "P1" | "P2") {
  if (!player) {
    return seatLabel === "P1" ? "Player 1" : "Player 2";
  }

  return player.ensName ?? player.displayName ?? player.walletAddress;
}

async function playerIsLobbyReady(walletAddress: string) {
  const player = await getPlayerByWallet(walletAddress);
  const runner = await getRunnerByWallet(walletAddress);

  return Boolean(player && runner?.status === "healthy");
}

async function getMatchRow(matchId: string) {
  return dbGet<MatchRow>(
    `SELECT ${MATCH_COLUMNS} FROM matches WHERE id = ?`,
    [matchId],
  );
}

async function getTranscriptRows(matchId: string) {
  return dbAll<TranscriptRow>(
    `SELECT id, match_id, phase, turn_index, speaker_role, speaker_label, seat_label, body, created_at
     FROM transcript_entries
     WHERE match_id = ?
     ORDER BY turn_index ASC`,
    [matchId],
  );
}

async function resolveSeatMap(row: MatchRow) {
  const [playerA, playerB] = await Promise.all([
    buildPlayerCard(row.player_a_wallet),
    buildPlayerCard(row.player_b_wallet),
  ]);
  const playerOne =
    row.player_a_seat === "P1"
      ? playerA
      : row.player_b_seat === "P1"
        ? playerB
        : null;
  const playerTwo =
    row.player_a_seat === "P2"
      ? playerA
      : row.player_b_seat === "P2"
        ? playerB
        : null;

  return {
    playerA,
    playerB,
    playerOne,
    playerTwo,
  };
}

function getPhaseState(row: MatchRow, nowMs = Date.now()) {
  if (!row.player_b_wallet || !row.live_started_at) {
    return {
      phase: "awaiting_opponent" as const,
      phaseLabel: "Waiting for opponent",
      phaseIndex: 0,
      totalPhases: phaseMoments.length,
      visibleTurns: 0,
      timerLabel: "Awaiting join",
      status: row.status as MatchStatus,
    };
  }

  const startedAtMs = Date.parse(row.live_started_at);
  let elapsed = Math.max(0, nowMs - startedAtMs);

  for (let index = 0; index < phaseMoments.length; index += 1) {
    const moment = phaseMoments[index];

    if (elapsed < moment.durationMs) {
      return {
        phase: moment.phase,
        phaseLabel: moment.label,
        phaseIndex: index + 1,
        totalPhases: phaseMoments.length,
        visibleTurns: moment.visibleTurns,
        timerLabel:
          moment.durationMs === Number.POSITIVE_INFINITY
            ? "Broadcast complete"
            : `${Math.max(1, Math.ceil((moment.durationMs - elapsed) / 1000))}s to next phase`,
        status: (moment.phase === "resolved" ? "resolved" : "live") as MatchStatus,
      };
    }

    elapsed -= moment.durationMs;
  }

  return {
    phase: "resolved" as const,
    phaseLabel: "Resolved",
    phaseIndex: phaseMoments.length,
    totalPhases: phaseMoments.length,
    visibleTurns: 9,
    timerLabel: "Broadcast complete",
    status: "resolved" as MatchStatus,
  };
}

function buildResolutionSummary(
  playerOneLabel: string,
  playerTwoLabel: string,
  playerOneAction: FinalAction,
  playerTwoAction: FinalAction,
) {
  if (playerOneAction === "SPLIT" && playerTwoAction === "SPLIT") {
    return `${playerOneLabel} and ${playerTwoLabel} both revealed SPLIT. Cooperative finish, even payout.`;
  }

  if (playerOneAction === "STEAL" && playerTwoAction === "STEAL") {
    return `${playerOneLabel} and ${playerTwoLabel} both revealed STEAL. Mutual collapse, no prestige gained.`;
  }

  if (playerOneAction === "STEAL") {
    return `${playerOneLabel} revealed STEAL against ${playerTwoLabel}'s SPLIT. Player 1 takes the edge on settlement.`;
  }

  return `${playerTwoLabel} revealed STEAL against ${playerOneLabel}'s SPLIT. Player 2 takes the edge on settlement.`;
}

function computeSettlement(
  stakeAmount: string,
  playerOneAction: FinalAction,
  playerTwoAction: FinalAction,
) {
  const stake = Number.parseFloat(stakeAmount);
  const normalizedStake = Number.isFinite(stake) ? stake : 0;

  if (playerOneAction === "SPLIT" && playerTwoAction === "SPLIT") {
    return {
      status: "claimable" as const,
      playerOnePayout: normalizedStake.toFixed(2),
      playerTwoPayout: normalizedStake.toFixed(2),
    };
  }

  if (playerOneAction === "STEAL" && playerTwoAction === "STEAL") {
    return {
      status: "settled" as const,
      playerOnePayout: "0.00",
      playerTwoPayout: "0.00",
    };
  }

  if (playerOneAction === "STEAL") {
    return {
      status: "claimable" as const,
      playerOnePayout: (normalizedStake * 2).toFixed(2),
      playerTwoPayout: "0.00",
    };
  }

  return {
    status: "claimable" as const,
    playerOnePayout: "0.00",
    playerTwoPayout: (normalizedStake * 2).toFixed(2),
  };
}

async function buildMatchScript(row: MatchRow, existingTranscript?: TranscriptRow[]) {
  const { playerOne, playerTwo } = await resolveSeatMap(row);
  const playerOneRunner = playerOne ? await getRunnerByWallet(playerOne.walletAddress) : null;
  const playerTwoRunner = playerTwo ? await getRunnerByWallet(playerTwo.walletAddress) : null;
  const p1Label = formatPlayerLabel(playerOne, "P1");
  const p2Label = formatPlayerLabel(playerTwo, "P2");
  const trustP1 = playerOne?.trustStatus ?? "trusted";
  const trustP2 = playerTwo?.trustStatus ?? "untrusted";
  const publicTranscript: Array<{ seatLabel: "P1" | "P2" | null; body: string }> = [];

  // Build a lookup of already-persisted turns to avoid re-calling runners
  const persisted = new Map<number, string>();
  if (existingTranscript) {
    for (const entry of existingTranscript) {
      persisted.set(entry.turn_index, entry.body);
    }
  }

  // Helper: use persisted turn if available, otherwise call the runner
  async function getPublicTurn(
    seatLabel: "P1" | "P2",
    turnIndex: number,
    runner: typeof playerOneRunner,
    playerLabel: string,
    opponentLabel: string,
    trustStatus: typeof trustP1,
  ) {
    const cached = persisted.get(turnIndex);
    if (cached) return cached;

    return executePublicTurn({
      matchId: row.id,
      seatLabel,
      turnIndex,
      runner,
      playerLabel,
      opponentLabel,
      trustStatus,
      transcript: publicTranscript,
    });
  }

  const firstP1 = await getPublicTurn("P1", 1, playerOneRunner, p1Label, p2Label, trustP1);
  publicTranscript.push({ seatLabel: "P1", body: firstP1 });

  const firstP2 = await getPublicTurn("P2", 2, playerTwoRunner, p2Label, p1Label, trustP2);
  publicTranscript.push({ seatLabel: "P2", body: firstP2 });

  const secondP1 = await getPublicTurn("P1", 3, playerOneRunner, p1Label, p2Label, trustP1);
  publicTranscript.push({ seatLabel: "P1", body: secondP1 });

  const secondP2 = await getPublicTurn("P2", 4, playerTwoRunner, p2Label, p1Label, trustP2);
  publicTranscript.push({ seatLabel: "P2", body: secondP2 });

  const thirdP1 = await getPublicTurn("P1", 5, playerOneRunner, p1Label, p2Label, trustP1);
  publicTranscript.push({ seatLabel: "P1", body: thirdP1 });

  const thirdP2 = await getPublicTurn("P2", 6, playerTwoRunner, p2Label, p1Label, trustP2);
  publicTranscript.push({ seatLabel: "P2", body: thirdP2 });

  const playerOneAction =
    row.player_one_committed_action ??
    row.player_one_final_action ??
    await executeFinalAction({
      matchId: row.id,
      seatLabel: "P1",
      runner: playerOneRunner,
      playerLabel: p1Label,
      opponentLabel: p2Label,
      trustStatus: trustP1,
      transcript: publicTranscript,
    });
  const playerTwoAction =
    row.player_two_committed_action ??
    row.player_two_final_action ??
    await executeFinalAction({
      matchId: row.id,
      seatLabel: "P2",
      runner: playerTwoRunner,
      playerLabel: p2Label,
      opponentLabel: p1Label,
      trustStatus: trustP2,
      transcript: publicTranscript,
    });
  const resolutionSummary =
    row.resolution_summary ??
    buildResolutionSummary(p1Label, p2Label, playerOneAction, playerTwoAction);

  const script: MatchScriptEntry[] = [
    {
      phase: "live_round_1",
      turnIndex: 1,
      speakerRole: "player",
      speakerLabel: p1Label,
      seatLabel: "P1",
      body: firstP1,
    },
    {
      phase: "live_round_2",
      turnIndex: 2,
      speakerRole: "player",
      speakerLabel: p2Label,
      seatLabel: "P2",
      body: firstP2,
    },
    {
      phase: "live_round_3",
      turnIndex: 3,
      speakerRole: "player",
      speakerLabel: p1Label,
      seatLabel: "P1",
      body: secondP1,
    },
    {
      phase: "live_round_4",
      turnIndex: 4,
      speakerRole: "player",
      speakerLabel: p2Label,
      seatLabel: "P2",
      body: secondP2,
    },
    {
      phase: "live_round_5",
      turnIndex: 5,
      speakerRole: "player",
      speakerLabel: p1Label,
      seatLabel: "P1",
      body: thirdP1,
    },
    {
      phase: "live_round_6",
      turnIndex: 6,
      speakerRole: "player",
      speakerLabel: p2Label,
      seatLabel: "P2",
      body: thirdP2,
    },
    {
      phase: "awaiting_commits",
      turnIndex: 7,
      speakerRole: "system",
      speakerLabel: "Arena desk",
      seatLabel: null,
      body: `Commit phase live. ${p1Label} and ${p2Label} have submitted hidden final actions through their runner lanes.`,
    },
    {
      phase: "awaiting_reveals",
      turnIndex: 8,
      speakerRole: "system",
      speakerLabel: "Arena desk",
      seatLabel: null,
      body: `Reveal phase in progress. Hidden actions are now opening for settlement: P1 committed ${playerOneAction}, P2 committed ${playerTwoAction}.`,
    },
    {
      phase: "resolved",
      turnIndex: 9,
      speakerRole: "system",
      speakerLabel: "Arena desk",
      seatLabel: null,
      body: resolutionSummary,
    },
  ];

  return {
    script,
    playerOneAction,
    playerTwoAction,
    resolutionSummary,
  };
}

async function syncMatchProgress(row: MatchRow, nowMs = Date.now()) {
  const transcriptRows = await getTranscriptRows(row.id);
  const phaseState = getPhaseState(row, nowMs);

  if (phaseState.phase === "awaiting_opponent") {
    return {
      row,
      transcriptRows,
      phaseState,
    };
  }

  const { script, playerOneAction, playerTwoAction, resolutionSummary } = await buildMatchScript(row, transcriptRows);
  const existingTurns = new Set(transcriptRows.map((entry) => entry.turn_index));
  const dueEntries = script.filter((entry) => entry.turnIndex <= phaseState.visibleTurns && !existingTurns.has(entry.turnIndex));
  const shouldCommit =
    phaseState.visibleTurns >= 7 &&
    (!row.player_one_commitment ||
      !row.player_two_commitment ||
      !row.player_one_commit_secret ||
      !row.player_two_commit_secret ||
      !row.player_one_committed_action ||
      !row.player_two_committed_action);
  const shouldReveal =
    phaseState.visibleTurns >= 8 &&
    (!row.player_one_final_action ||
      !row.player_two_final_action ||
      !row.commit_verified_at) &&
    !row.reveal_verification_error;

  let commitmentRecord:
    | {
        playerOneCommitment: string;
        playerTwoCommitment: string;
        playerOneSecret: string;
        playerTwoSecret: string;
        playerOneAction: FinalAction;
        playerTwoAction: FinalAction;
      }
    | null = null;

  if (shouldCommit) {
    const playerOneCommit = createCommitment(playerOneAction);
    const playerTwoCommit = createCommitment(playerTwoAction);
    commitmentRecord = {
      playerOneCommitment: playerOneCommit.commitment,
      playerTwoCommitment: playerTwoCommit.commitment,
      playerOneSecret: playerOneCommit.secret,
      playerTwoSecret: playerTwoCommit.secret,
      playerOneAction,
      playerTwoAction,
    };
  }

  let revealVerification:
    | {
        playerOneAction: FinalAction;
        playerTwoAction: FinalAction;
        verifiedAt: string;
        verificationError: string | null;
      }
    | null = null;

  if (shouldReveal) {
    const playerOneCommittedAction =
      row.player_one_committed_action ?? commitmentRecord?.playerOneAction ?? null;
    const playerTwoCommittedAction =
      row.player_two_committed_action ?? commitmentRecord?.playerTwoAction ?? null;
    const playerOneSecret = row.player_one_commit_secret ?? commitmentRecord?.playerOneSecret ?? null;
    const playerTwoSecret = row.player_two_commit_secret ?? commitmentRecord?.playerTwoSecret ?? null;
    const playerOneCommitment =
      row.player_one_commitment ?? commitmentRecord?.playerOneCommitment ?? null;
    const playerTwoCommitment =
      row.player_two_commitment ?? commitmentRecord?.playerTwoCommitment ?? null;

    const valid =
      Boolean(
        playerOneCommittedAction &&
          playerTwoCommittedAction &&
          playerOneSecret &&
          playerTwoSecret &&
          playerOneCommitment &&
          playerTwoCommitment,
      ) &&
      verifyCommitment({
        action: playerOneCommittedAction as FinalAction,
        secret: playerOneSecret as string,
        commitment: playerOneCommitment as string,
      }) &&
      verifyCommitment({
        action: playerTwoCommittedAction as FinalAction,
        secret: playerTwoSecret as string,
        commitment: playerTwoCommitment as string,
      });

    revealVerification = valid
      ? {
          playerOneAction: playerOneCommittedAction as FinalAction,
          playerTwoAction: playerTwoCommittedAction as FinalAction,
          verifiedAt: nowIso(),
          verificationError: null,
        }
      : {
          playerOneAction,
          playerTwoAction,
          verifiedAt: nowIso(),
          verificationError: "Commitment verification failed during reveal.",
      };
  }

  const settlement =
    revealVerification && !revealVerification.verificationError
      ? computeSettlement(row.stake_amount, revealVerification.playerOneAction, revealVerification.playerTwoAction)
      : null;

  // Fire-and-forget on-chain resolution when settlement is computed
  if (settlement && revealVerification && !revealVerification.verificationError) {
    import("@/lib/services/settlement")
      .then(({ resolveMatchOnChain }) =>
        resolveMatchOnChain({
          matchId: row.id,
          finalActionA: revealVerification.playerOneAction,
          finalActionB: revealVerification.playerTwoAction,
        }),
      )
      .catch(() => {
        // On-chain settlement is best-effort — off-chain state is authoritative for MVP
      });
  }

  if (
    dueEntries.length > 0 ||
    row.phase !== phaseState.phase ||
    row.status !== phaseState.status ||
    shouldCommit ||
    shouldReveal
  ) {
    const statements: Array<{ sql: string; args?: unknown[] }> = [];

    for (const entry of dueEntries) {
      statements.push({
        sql: `INSERT INTO transcript_entries (
          id, match_id, phase, turn_index, speaker_role, speaker_label, seat_label, body, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `entry_${randomUUID().replaceAll("-", "")}`,
          row.id,
          entry.phase,
          entry.turnIndex,
          entry.speakerRole,
          entry.speakerLabel,
          entry.seatLabel,
          entry.body,
          nowIso(),
        ],
      });
    }

    statements.push({
      sql: `UPDATE matches
       SET phase = ?, status = ?, resolved_at = ?,
           player_one_commitment = ?, player_two_commitment = ?,
           player_one_commit_secret = ?, player_two_commit_secret = ?,
           player_one_committed_action = ?, player_two_committed_action = ?,
           player_one_final_action = ?, player_two_final_action = ?,
           commit_verified_at = ?, reveal_verification_error = ?,
           settlement_status = ?, player_one_payout = ?, player_two_payout = ?,
           player_one_claimed_at = ?, player_two_claimed_at = ?,
           resolution_summary = ?, updated_at = ?
       WHERE id = ?`,
      args: [
        revealVerification?.verificationError ? "awaiting_reveals" : phaseState.phase,
        revealVerification?.verificationError ? "cancelled" : phaseState.status,
        phaseState.phase === "resolved" && !revealVerification?.verificationError ? nowIso() : row.resolved_at,
        row.player_one_commitment ?? commitmentRecord?.playerOneCommitment ?? null,
        row.player_two_commitment ?? commitmentRecord?.playerTwoCommitment ?? null,
        row.player_one_commit_secret ?? commitmentRecord?.playerOneSecret ?? null,
        row.player_two_commit_secret ?? commitmentRecord?.playerTwoSecret ?? null,
        row.player_one_committed_action ?? commitmentRecord?.playerOneAction ?? null,
        row.player_two_committed_action ?? commitmentRecord?.playerTwoAction ?? null,
        row.player_one_final_action ??
          (revealVerification && !revealVerification.verificationError
            ? revealVerification.playerOneAction
            : null),
        row.player_two_final_action ??
          (revealVerification && !revealVerification.verificationError
            ? revealVerification.playerTwoAction
            : null),
        row.commit_verified_at ??
          (revealVerification && !revealVerification.verificationError
            ? revealVerification.verifiedAt
            : null),
        revealVerification?.verificationError ?? row.reveal_verification_error,
        settlement?.status ?? row.settlement_status ?? "pending",
        settlement?.playerOnePayout ?? row.player_one_payout ?? null,
        settlement?.playerTwoPayout ?? row.player_two_payout ?? null,
        row.player_one_claimed_at,
        row.player_two_claimed_at,
        revealVerification && !revealVerification.verificationError
          ? resolutionSummary
          : row.resolution_summary,
        nowIso(),
        row.id,
      ],
    });

    await dbBatch(statements);
  }

  const refreshedRow = await getMatchRow(row.id);
  return {
    row: refreshedRow ?? row,
    transcriptRows: await getTranscriptRows(row.id),
    phaseState: getPhaseState(refreshedRow ?? row, nowMs),
  };
}

async function mapMatchListItem(row: MatchRow) {
  return {
    id: row.id,
    stakeAmount: row.stake_amount,
    status: row.status,
    playerA: await buildPlayerCard(row.player_a_wallet),
    playerB: await buildPlayerCard(row.player_b_wallet),
  };
}

function determineWinningSeat(row: MatchRow) {
  const playerOnePayout = Number.parseFloat(row.player_one_payout ?? "0");
  const playerTwoPayout = Number.parseFloat(row.player_two_payout ?? "0");

  if (playerOnePayout > playerTwoPayout) {
    return "P1" as const;
  }

  if (playerTwoPayout > playerOnePayout) {
    return "P2" as const;
  }

  if (
    row.commit_verified_at ||
    row.reveal_verification_error ||
    row.status === "resolved" ||
    row.settlement_status === "settled"
  ) {
    return "draw" as const;
  }

  return null;
}

export async function listOpenMatches() {
  const rows = await dbAll<MatchRow>(
    `SELECT ${MATCH_COLUMNS}
     FROM matches
     WHERE player_b_wallet IS NULL
     ORDER BY created_at DESC`,
  );

  return Promise.all(rows.map(mapMatchListItem));
}

export async function listRecentMatches(limit = 6, options?: { nowMs?: number }) {
  const rows = await dbAll<MatchRow>(
    `SELECT ${MATCH_COLUMNS}
     FROM matches
     WHERE player_b_wallet IS NOT NULL
     ORDER BY COALESCE(resolved_at, live_started_at, updated_at) DESC
     LIMIT ?`,
    [Math.max(limit * 2, limit)],
  );

  const recent: RecentMatchListItem[] = [];

  for (const row of rows) {
    // Skip sync for already-resolved matches — no need to call runners again
    const alreadyResolved = row.status === "resolved" || row.status === "cancelled";
    const synced = alreadyResolved
      ? { row, transcriptRows: await getTranscriptRows(row.id), phaseState: getPhaseState(row, options?.nowMs) }
      : await syncMatchProgress(row, options?.nowMs);

    if (
      !synced.row.commit_verified_at &&
      !synced.row.reveal_verification_error &&
      synced.phaseState.phase !== "resolved" &&
      synced.row.settlement_status === "pending"
    ) {
      continue;
    }

    const { playerOne, playerTwo } = await resolveSeatMap(synced.row);
    recent.push({
      id: synced.row.id,
      stakeAmount: synced.row.stake_amount,
      status: synced.row.status,
      phase: synced.phaseState.phase,
      resolvedAt: synced.row.resolved_at,
      resolutionSummary: synced.row.resolution_summary,
      winningSeat: determineWinningSeat(synced.row),
      playerOne,
      playerTwo,
      settlement: {
        status: synced.row.settlement_status ?? "pending",
        playerOnePayout: synced.row.player_one_payout ?? "0.00",
        playerTwoPayout: synced.row.player_two_payout ?? "0.00",
        playerOneClaimed: Boolean(synced.row.player_one_claimed_at),
        playerTwoClaimed: Boolean(synced.row.player_two_claimed_at),
      },
    });

    if (recent.length >= limit) {
      break;
    }
  }

  return recent;
}

export async function createMatch(input: CreateMatchInput) {
  const walletAddress = normalizeWalletAddress(input.walletAddress);

  if (!(await playerIsLobbyReady(walletAddress))) {
    return {
      error: "Player must choose trust mode and register a healthy runner before entering the lobby.",
    };
  }

  const id = `match_${randomUUID().replaceAll("-", "")}`;
  const timestamp = nowIso();
  const watcherCount = 80 + (id.charCodeAt(id.length - 1) % 170);

  await dbRun(
    `INSERT INTO matches (
      id, stake_amount, status, phase,
      player_a_wallet, player_b_wallet,
      player_a_seat, player_b_seat,
      watcher_count, live_started_at, resolved_at,
      player_one_commitment, player_two_commitment,
      player_one_commit_secret, player_two_commit_secret,
      player_one_committed_action, player_two_committed_action,
      player_one_final_action, player_two_final_action,
      commit_verified_at, reveal_verification_error,
      settlement_status, player_one_payout, player_two_payout,
      player_one_claimed_at, player_two_claimed_at,
      resolution_summary, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.stakeAmount.trim(),
      "awaiting_deposits",
      "draft",
      walletAddress,
      null, null, null,
      watcherCount,
      null, null, null, null, null, null, null, null, null, null, null, null,
      "pending", null, null, null, null, null,
      timestamp, timestamp,
    ],
  );

  const row = await getMatchRow(id);

  if (!row) {
    return { error: "Failed to create match." };
  }

  return { match: await mapMatchListItem(row) };
}

export async function joinMatch(matchId: string, walletAddress: string) {
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  const existing = await getMatchRow(matchId);

  if (!existing) {
    return { error: "Match not found." };
  }

  if (existing.player_b_wallet) {
    return { error: "Match already has two players." };
  }

  if (existing.player_a_wallet === normalizedWallet) {
    return { error: "Player cannot join their own match." };
  }

  if (!(await playerIsLobbyReady(normalizedWallet))) {
    return {
      error: "Joining player must choose trust mode and register a healthy runner before entering the lobby.",
    };
  }

  const playerASeat =
    parseInt(matchId.replace(/\D/g, "").slice(-1) || "0", 10) % 2 === 0 ? "P1" : "P2";
  const playerBSeat = playerASeat === "P1" ? "P2" : "P1";
  const timestamp = nowIso();

  await dbRun(
    `UPDATE matches
     SET player_b_wallet = ?, player_a_seat = ?, player_b_seat = ?, status = ?, phase = ?, live_started_at = ?, updated_at = ?
     WHERE id = ?`,
    [
      normalizedWallet,
      playerASeat,
      playerBSeat,
      "live",
      "waiting_to_start",
      timestamp,
      timestamp,
      matchId,
    ],
  );

  const row = await getMatchRow(matchId);

  if (!row) {
    return { error: "Failed to join match." };
  }

  return { match: await mapMatchListItem(row) };
}

export async function createSelfPlayMatch(input: CreateMatchInput) {
  const walletAddress = normalizeWalletAddress(input.walletAddress);

  if (!(await playerIsLobbyReady(walletAddress))) {
    return {
      error: "Player must choose trust mode and register a healthy runner before entering the lobby.",
    };
  }

  const id = `match_${randomUUID().replaceAll("-", "")}`;
  const timestamp = nowIso();
  const watcherCount = 80 + (id.charCodeAt(id.length - 1) % 170);
  const playerASeat = parseInt(id.replace(/\D/g, "").slice(-1) || "0", 10) % 2 === 0 ? "P1" : "P2";
  const playerBSeat = playerASeat === "P1" ? "P2" : "P1";

  await dbRun(
    `INSERT INTO matches (
      id, stake_amount, status, phase,
      player_a_wallet, player_b_wallet,
      player_a_seat, player_b_seat,
      watcher_count, live_started_at, resolved_at,
      player_one_commitment, player_two_commitment,
      player_one_commit_secret, player_two_commit_secret,
      player_one_committed_action, player_two_committed_action,
      player_one_final_action, player_two_final_action,
      commit_verified_at, reveal_verification_error,
      settlement_status, player_one_payout, player_two_payout,
      player_one_claimed_at, player_two_claimed_at,
      resolution_summary, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.stakeAmount.trim(),
      "live",
      "waiting_to_start",
      walletAddress, walletAddress,
      playerASeat, playerBSeat,
      watcherCount, timestamp,
      null, null, null, null, null, null, null, null, null, null, null,
      "pending", null, null, null, null, null,
      timestamp, timestamp,
    ],
  );

  const row = await getMatchRow(id);
  if (!row) return { error: "Failed to create self-play match." };
  return { match: await mapMatchListItem(row) };
}

export async function claimMatchPayout(matchId: string, walletAddress: string) {
  const row = await getMatchRow(matchId);

  if (!row) {
    return { error: "Match not found." };
  }

  if (!row.commit_verified_at || row.reveal_verification_error) {
    return { error: "Match settlement is not ready for claims." };
  }

  const normalizedWallet = normalizeWalletAddress(walletAddress);
  const isPlayerOne =
    (row.player_a_seat === "P1" && row.player_a_wallet === normalizedWallet) ||
    (row.player_b_seat === "P1" && row.player_b_wallet === normalizedWallet);
  const isPlayerTwo =
    (row.player_a_seat === "P2" && row.player_a_wallet === normalizedWallet) ||
    (row.player_b_seat === "P2" && row.player_b_wallet === normalizedWallet);

  if (!isPlayerOne && !isPlayerTwo) {
    return { error: "Wallet is not part of this match." };
  }

  const payout = isPlayerOne ? row.player_one_payout : row.player_two_payout;
  const claimedAt = isPlayerOne ? row.player_one_claimed_at : row.player_two_claimed_at;

  if (!payout || Number.parseFloat(payout) <= 0) {
    return { error: "No payout is claimable for this wallet." };
  }

  if (claimedAt) {
    return { error: "Payout already claimed for this wallet." };
  }

  const timestamp = nowIso();
  const nextPlayerOneClaimedAt = isPlayerOne ? timestamp : row.player_one_claimed_at;
  const nextPlayerTwoClaimedAt = isPlayerTwo ? timestamp : row.player_two_claimed_at;
  const playerOneOutstanding = Number.parseFloat(row.player_one_payout ?? "0") > 0 && !nextPlayerOneClaimedAt;
  const playerTwoOutstanding = Number.parseFloat(row.player_two_payout ?? "0") > 0 && !nextPlayerTwoClaimedAt;
  const settlementStatus = playerOneOutstanding || playerTwoOutstanding ? "claimable" : "settled";

  await dbRun(
    `UPDATE matches
     SET player_one_claimed_at = ?, player_two_claimed_at = ?, settlement_status = ?, updated_at = ?
     WHERE id = ?`,
    [nextPlayerOneClaimedAt, nextPlayerTwoClaimedAt, settlementStatus, timestamp, matchId],
  );

  return {
    ok: true,
    matchId,
    walletAddress: normalizedWallet,
    payout,
  };
}

export async function getMatchDetail(matchId: string, options?: { nowMs?: number }): Promise<MatchSnapshot | null> {
  const row = await getMatchRow(matchId);

  if (!row) {
    return null;
  }

  const synced = await syncMatchProgress(row, options?.nowMs);
  const { playerA, playerB, playerOne, playerTwo } = await resolveSeatMap(synced.row);

  return {
    id: synced.row.id,
    stakeAmount: synced.row.stake_amount,
    status: synced.row.status,
    phase: synced.phaseState.phase,
    phaseLabel: synced.phaseState.phaseLabel,
    phaseIndex: synced.phaseState.phaseIndex,
    totalPhases: synced.phaseState.totalPhases,
    watcherCount: synced.row.watcher_count,
    timerLabel: synced.phaseState.timerLabel,
    readyToWatch: Boolean(synced.row.player_b_wallet && synced.row.live_started_at),
    resolutionSummary: synced.row.resolution_summary,
    commitmentState: {
      playerOneCommitted: Boolean(synced.row.player_one_commitment),
      playerTwoCommitted: Boolean(synced.row.player_two_commitment),
      revealVerified: Boolean(synced.row.commit_verified_at),
      verificationError: synced.row.reveal_verification_error,
    },
    finalActions: {
      playerOne: synced.row.player_one_final_action,
      playerTwo: synced.row.player_two_final_action,
    },
    settlement: {
      status: synced.row.settlement_status ?? "pending",
      playerOnePayout: synced.row.player_one_payout ?? "0.00",
      playerTwoPayout: synced.row.player_two_payout ?? "0.00",
      playerOneClaimed: Boolean(synced.row.player_one_claimed_at),
      playerTwoClaimed: Boolean(synced.row.player_two_claimed_at),
    },
    playerA,
    playerB,
    playerOne,
    playerTwo,
    transcript: synced.transcriptRows.map((entry) => ({
      id: entry.id,
      phase: entry.phase,
      turnIndex: entry.turn_index,
      speakerRole: entry.speaker_role,
      speakerLabel: entry.speaker_label,
      seatLabel: entry.seat_label,
      body: entry.body,
      tone:
        entry.speaker_role === "system"
          ? "system"
          : entry.seat_label === "P1"
            ? "p1"
            : "p2",
    })),
  };
}
