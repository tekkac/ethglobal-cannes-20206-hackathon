import { randomUUID } from "node:crypto";

import type { RunnerStatus, TrustStatus } from "@agent-duel/shared";

import { dbGet, dbRun } from "@/lib/db/store";
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

export async function getPlayerByWallet(walletAddress: string) {
  const row = await dbGet<PlayerRow>(
    `SELECT wallet_address, trust_status, display_name, ens_name, ens_avatar, world_nullifier_hash
     FROM players
     WHERE wallet_address = ?`,
    [normalizeWalletAddress(walletAddress)],
  );

  return mapPlayer(row);
}

export async function getRunnerByWallet(walletAddress: string) {
  const row = await dbGet<RunnerRow>(
    `SELECT wallet_address, runner_label, mode, endpoint_url, runner_token, status, last_seen_at
     FROM runners
     WHERE wallet_address = ?`,
    [normalizeWalletAddress(walletAddress)],
  );

  return mapRunner(row);
}

export function createRunnerToken() {
  return `runner_${randomUUID().replaceAll("-", "")}`;
}

export async function upsertPlayer(input: UpsertPlayerInput) {
  const walletAddress = normalizeWalletAddress(input.walletAddress);
  const existing = await getPlayerByWallet(walletAddress);
  const timestamp = nowIso();
  const ensProfile = await resolveEnsProfile(walletAddress);
  const displayName =
    existing?.displayName ?? (ensProfile.name ? ensProfile.name.replace(/\.eth$/, "") : null);

  await dbRun(
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
    [
      walletAddress,
      input.trustStatus,
      displayName,
      ensProfile.name,
      ensProfile.avatar,
      input.worldNullifierHash ?? null,
      timestamp,
      timestamp,
    ],
  );

  return getPlayerByWallet(walletAddress);
}

export async function registerRunner(input: RegisterRunnerInput) {
  const walletAddress = normalizeWalletAddress(input.walletAddress);

  if (!(await getPlayerByWallet(walletAddress))) {
    return null;
  }

  const existing = await getRunnerByWallet(walletAddress);
  const timestamp = nowIso();
  const runnerToken = input.runnerToken?.trim() || existing?.runnerToken || createRunnerToken();

  await dbRun(
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
    [
      walletAddress,
      input.runnerLabel.trim(),
      input.mode,
      input.endpointUrl,
      runnerToken,
      "issued",
      existing?.lastSeenAt ?? null,
      timestamp,
      timestamp,
    ],
  );

  return getRunnerByWallet(walletAddress);
}

export async function testRunner(walletAddress: string) {
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  const existing = await getRunnerByWallet(normalizedWallet);

  if (!existing) {
    return null;
  }

  const timestamp = nowIso();

  await dbRun(
    `UPDATE runners
     SET status = ?, last_seen_at = ?, updated_at = ?
     WHERE wallet_address = ?`,
    ["healthy", timestamp, timestamp, normalizedWallet],
  );

  return getRunnerByWallet(normalizedWallet);
}
