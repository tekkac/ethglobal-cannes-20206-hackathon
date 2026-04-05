import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

let dbInstance: Database.Database | null = null;

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(moduleDirectory, "../../../../../");

function resolveDatabasePath() {
  const configured = process.env.DATABASE_URL ?? "../../data/sqlite/arena.db";
  return resolve(workspaceRoot, configured);
}

function bootstrap(db: Database.Database) {
  db.pragma("journal_mode = WAL");

  db.exec(`
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
  `);

  ensureColumn(db, "matches", "phase", "TEXT NOT NULL DEFAULT 'draft'");
  ensureColumn(db, "matches", "player_a_seat", "TEXT");
  ensureColumn(db, "matches", "player_b_seat", "TEXT");
  ensureColumn(db, "matches", "watcher_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "matches", "live_started_at", "TEXT");
  ensureColumn(db, "matches", "resolved_at", "TEXT");
  ensureColumn(db, "matches", "player_one_commitment", "TEXT");
  ensureColumn(db, "matches", "player_two_commitment", "TEXT");
  ensureColumn(db, "matches", "player_one_commit_secret", "TEXT");
  ensureColumn(db, "matches", "player_two_commit_secret", "TEXT");
  ensureColumn(db, "matches", "player_one_committed_action", "TEXT");
  ensureColumn(db, "matches", "player_two_committed_action", "TEXT");
  ensureColumn(db, "matches", "player_one_final_action", "TEXT");
  ensureColumn(db, "matches", "player_two_final_action", "TEXT");
  ensureColumn(db, "matches", "commit_verified_at", "TEXT");
  ensureColumn(db, "matches", "reveal_verification_error", "TEXT");
  ensureColumn(db, "matches", "settlement_status", "TEXT");
  ensureColumn(db, "matches", "player_one_payout", "TEXT");
  ensureColumn(db, "matches", "player_two_payout", "TEXT");
  ensureColumn(db, "matches", "player_one_claimed_at", "TEXT");
  ensureColumn(db, "matches", "player_two_claimed_at", "TEXT");
  ensureColumn(db, "matches", "resolution_summary", "TEXT");
}

function ensureColumn(
  db: Database.Database,
  tableName: "matches",
  columnName: string,
  definition: string,
) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databasePath = resolveDatabasePath();
  mkdirSync(dirname(databasePath), { recursive: true });
  dbInstance = new Database(databasePath);
  bootstrap(dbInstance);
  return dbInstance;
}
