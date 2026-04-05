import { createClient, type Client, type InStatement } from "@libsql/client";

let clientInstance: Client | null = null;
let bootstrapped = false;

function getClient(): Client {
  if (clientInstance) return clientInstance;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    // Production: Turso cloud
    clientInstance = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
  } else {
    // Local dev: file-based SQLite via libsql
    clientInstance = createClient({
      url: process.env.VITEST ? "file::memory:" : "file:data/arena.db",
    });
  }

  return clientInstance;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS players (
    wallet_address TEXT PRIMARY KEY,
    trust_status TEXT NOT NULL,
    display_name TEXT,
    ens_name TEXT,
    ens_avatar TEXT,
    world_nullifier_hash TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS runners (
    wallet_address TEXT PRIMARY KEY,
    runner_label TEXT NOT NULL,
    mode TEXT NOT NULL,
    endpoint_url TEXT,
    runner_token TEXT NOT NULL,
    status TEXT NOT NULL,
    last_seen_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (wallet_address) REFERENCES players(wallet_address)
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    stake_amount TEXT NOT NULL,
    status TEXT NOT NULL,
    phase TEXT NOT NULL DEFAULT 'draft',
    player_a_wallet TEXT NOT NULL,
    player_b_wallet TEXT,
    player_a_seat TEXT,
    player_b_seat TEXT,
    watcher_count INTEGER NOT NULL DEFAULT 0,
    live_started_at TEXT,
    resolved_at TEXT,
    player_one_commitment TEXT,
    player_two_commitment TEXT,
    player_one_commit_secret TEXT,
    player_two_commit_secret TEXT,
    player_one_committed_action TEXT,
    player_two_committed_action TEXT,
    player_one_final_action TEXT,
    player_two_final_action TEXT,
    commit_verified_at TEXT,
    reveal_verification_error TEXT,
    settlement_status TEXT,
    player_one_payout TEXT,
    player_two_payout TEXT,
    player_one_claimed_at TEXT,
    player_two_claimed_at TEXT,
    resolution_summary TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (player_a_wallet) REFERENCES players(wallet_address),
    FOREIGN KEY (player_b_wallet) REFERENCES players(wallet_address)
  );

  CREATE TABLE IF NOT EXISTS transcript_entries (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    turn_index INTEGER NOT NULL,
    speaker_role TEXT NOT NULL,
    speaker_label TEXT NOT NULL,
    seat_label TEXT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (match_id) REFERENCES matches(id)
  );
`;

const ENSURE_COLUMNS = [
  ["matches", "phase", "TEXT NOT NULL DEFAULT 'draft'"],
  ["matches", "player_a_seat", "TEXT"],
  ["matches", "player_b_seat", "TEXT"],
  ["matches", "watcher_count", "INTEGER NOT NULL DEFAULT 0"],
  ["matches", "live_started_at", "TEXT"],
  ["matches", "resolved_at", "TEXT"],
  ["matches", "player_one_commitment", "TEXT"],
  ["matches", "player_two_commitment", "TEXT"],
  ["matches", "player_one_commit_secret", "TEXT"],
  ["matches", "player_two_commit_secret", "TEXT"],
  ["matches", "player_one_committed_action", "TEXT"],
  ["matches", "player_two_committed_action", "TEXT"],
  ["matches", "player_one_final_action", "TEXT"],
  ["matches", "player_two_final_action", "TEXT"],
  ["matches", "commit_verified_at", "TEXT"],
  ["matches", "reveal_verification_error", "TEXT"],
  ["matches", "settlement_status", "TEXT"],
  ["matches", "player_one_payout", "TEXT"],
  ["matches", "player_two_payout", "TEXT"],
  ["matches", "player_one_claimed_at", "TEXT"],
  ["matches", "player_two_claimed_at", "TEXT"],
  ["matches", "resolution_summary", "TEXT"],
] as const;

async function bootstrap() {
  if (bootstrapped) return;
  const client = getClient();

  // Create tables
  for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
    await client.execute(stmt);
  }

  // Ensure columns exist
  for (const [table, column, def] of ENSURE_COLUMNS) {
    const cols = await client.execute(`PRAGMA table_info(${table})`);
    const exists = cols.rows.some((r) => r.name === column);
    if (!exists) {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    }
  }

  bootstrapped = true;
}

// ---- Public async API that mirrors the old sync API shape ----

export async function dbExecute(sql: string, args?: unknown[]) {
  await bootstrap();
  return getClient().execute({ sql, args: args ?? [] } as InStatement);
}

export async function dbGet<T = Record<string, unknown>>(sql: string, args?: unknown[]): Promise<T | undefined> {
  await bootstrap();
  const result = await getClient().execute({ sql, args: args ?? [] } as InStatement);
  return result.rows[0] as T | undefined;
}

export async function dbAll<T = Record<string, unknown>>(sql: string, args?: unknown[]): Promise<T[]> {
  await bootstrap();
  const result = await getClient().execute({ sql, args: args ?? [] } as InStatement);
  return result.rows as T[];
}

export async function dbRun(sql: string, args?: unknown[]) {
  await bootstrap();
  return getClient().execute({ sql, args: args ?? [] } as InStatement);
}

export async function dbBatch(statements: Array<{ sql: string; args?: unknown[] }>) {
  await bootstrap();
  return getClient().batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] }) as InStatement),
    "write",
  );
}
