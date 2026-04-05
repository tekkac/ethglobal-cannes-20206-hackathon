import { randomUUID } from "node:crypto";

import type { RunnerStatus, TrustStatus } from "@agent-duel/shared";

import { getDb } from "@/lib/db/store";
import { resolveEnsProfile } from "@/lib/services/ens";

type PlayerRow = {
  wallet_address: string;
  trust_status: TrustStatus;
  display_name: string | null;
  ens_name: string | null;
  ens_avatar: string | null;
  world_nullifier_hash: string | null;
};

type RunnerRow = {
  wallet_address: string;
  runner_label: string;
  mode: string;
  endpoint_url: string | null;
  runner_token: string;
  status: RunnerStatus;
  last_seen_at: string | null;
};

type UpsertPlayerInput = {
  walletAddress: string;
  trustStatus: TrustStatus;
  worldNullifierHash?: string;
};

type RegisterRunnerInput = {
  walletAddress: string;
  runnerLabel: string;
  mode: string;
  endpointUrl: string | null;
  runnerToken?: string;
};

function normalizeWalletAddress(walletAddress: string) {
  return walletAddress.trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function mapPlayer(row: PlayerRow | undefined | null) {
  if (!row) {
    return null;
  }

  return {
    walletAddress: row.wallet_address,
    trustStatus: row.trust_status,
    displayName: row.display_name,
    ensName: row.ens_name,
    ensAvatar: row.ens_avatar,
    worldNullifierHash: row.world_nullifier_hash,
  };
}

function mapRunner(row: RunnerRow | undefined | null) {
  if (!row) {
    return null;
  }

  return {
    runnerLabel: row.runner_label,
    mode: row.mode,
    endpointUrl: row.endpoint_url,
    runnerToken: row.runner_token,
    status: row.status,
    lastSeenAt: row.last_seen_at,
  };
}

export function getPlayerByWallet(walletAddress: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT wallet_address, trust_status, display_name, ens_name, ens_avatar, world_nullifier_hash
       FROM players
       WHERE wallet_address = ?`,
    )
    .get(normalizeWalletAddress(walletAddress)) as PlayerRow | undefined;

  return mapPlayer(row);
}

export function getRunnerByWallet(walletAddress: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT wallet_address, runner_label, mode, endpoint_url, runner_token, status, last_seen_at
       FROM runners
       WHERE wallet_address = ?`,
    )
    .get(normalizeWalletAddress(walletAddress)) as RunnerRow | undefined;

  return mapRunner(row);
}

export function createRunnerToken() {
  return `runner_${randomUUID().replaceAll("-", "")}`;
}

export async function upsertPlayer(input: UpsertPlayerInput) {
  const db = getDb();
  const walletAddress = normalizeWalletAddress(input.walletAddress);
  const existing = getPlayerByWallet(walletAddress);
  const timestamp = nowIso();
  const ensProfile = await resolveEnsProfile(walletAddress);
  const displayName =
    existing?.displayName ?? (ensProfile.name ? ensProfile.name.replace(/\.eth$/, "") : null);

  db.prepare(
    `INSERT INTO players (
      wallet_address,
      trust_status,
      display_name,
      ens_name,
      ens_avatar,
      world_nullifier_hash,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(wallet_address) DO UPDATE SET
      trust_status = excluded.trust_status,
      display_name = excluded.display_name,
      ens_name = excluded.ens_name,
      ens_avatar = excluded.ens_avatar,
      world_nullifier_hash = excluded.world_nullifier_hash,
      updated_at = excluded.updated_at`,
  ).run(
    walletAddress,
    input.trustStatus,
    displayName,
    ensProfile.name,
    ensProfile.avatar,
    input.worldNullifierHash ?? null,
    timestamp,
    timestamp,
  );

  return getPlayerByWallet(walletAddress);
}

export function registerRunner(input: RegisterRunnerInput) {
  const db = getDb();
  const walletAddress = normalizeWalletAddress(input.walletAddress);

  if (!getPlayerByWallet(walletAddress)) {
    return null;
  }

  const existing = getRunnerByWallet(walletAddress);
  const timestamp = nowIso();
  const runnerToken = input.runnerToken?.trim() || existing?.runnerToken || createRunnerToken();

  db.prepare(
    `INSERT INTO runners (
      wallet_address,
      runner_label,
      mode,
      endpoint_url,
      runner_token,
      status,
      last_seen_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(wallet_address) DO UPDATE SET
      runner_label = excluded.runner_label,
      mode = excluded.mode,
      endpoint_url = excluded.endpoint_url,
      runner_token = excluded.runner_token,
      status = excluded.status,
      last_seen_at = excluded.last_seen_at,
      updated_at = excluded.updated_at`,
  ).run(
    walletAddress,
    input.runnerLabel.trim(),
    input.mode,
    input.endpointUrl,
    runnerToken,
    "issued",
    existing?.lastSeenAt ?? null,
    timestamp,
    timestamp,
  );

  return getRunnerByWallet(walletAddress);
}

export function testRunner(walletAddress: string) {
  const db = getDb();
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  const existing = getRunnerByWallet(normalizedWallet);

  if (!existing) {
    return null;
  }

  const timestamp = nowIso();

  db.prepare(
    `UPDATE runners
     SET status = ?, last_seen_at = ?, updated_at = ?
     WHERE wallet_address = ?`,
  ).run("healthy", timestamp, timestamp, normalizedWallet);

  return getRunnerByWallet(normalizedWallet);
}

