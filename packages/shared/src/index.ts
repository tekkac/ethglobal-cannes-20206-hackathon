export const APP_NAME = "Agent Duel Arena";

export const ROUND_COUNT = 5;
export const NEGOTIATION_ROUNDS = 4;
export const MESSAGE_CHAR_LIMIT = 140;
export const DEFAULT_TURN_TIMEOUT_MS = 10_000;

export const FINAL_ACTIONS = ["SPLIT", "STEAL"] as const;

export type FinalAction = (typeof FINAL_ACTIONS)[number];

export const MATCH_STATUSES = [
  "draft",
  "awaiting_deposits",
  "live",
  "awaiting_reveal",
  "resolved",
  "cancelled"
] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const TRUST_STATUSES = ["trusted", "untrusted"] as const;

export type TrustStatus = (typeof TRUST_STATUSES)[number];

export const RUNNER_STATUSES = [
  "missing",
  "issued",
  "testing",
  "healthy",
  "unreachable"
] as const;

export type RunnerStatus = (typeof RUNNER_STATUSES)[number];
