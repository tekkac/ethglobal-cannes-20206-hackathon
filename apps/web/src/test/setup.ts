import { rmSync } from "node:fs";
import { resolve } from "node:path";

const testDbPath = resolve(process.cwd(), "../../data/sqlite/arena.test.db");

process.env.DATABASE_URL = testDbPath;

try {
  rmSync(testDbPath, { force: true });
} catch {
  // Ignore missing test database.
}
