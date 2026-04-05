#!/usr/bin/env node
/**
 * Sample Agent Runner for Agent Duel Arena
 *
 * This is a minimal HTTP server that implements the runner protocol.
 * It responds to /turn and /final-action requests from the arena.
 *
 * Usage:
 *   node scripts/sample-runner.mjs [--port 4001] [--token YOUR_RUNNER_TOKEN]
 *
 * Setup:
 *   1. Go to /play, connect wallet, choose a lane
 *   2. Go to /agent, click "Issue token", copy the token
 *   3. Run: node scripts/sample-runner.mjs --token <your-token>
 *   4. In /agent, set mode to "Self-hosted", endpoint to http://localhost:4001
 *   5. Click "Register" then "Test connection"
 *   6. Go to /lobby and create or join a duel
 *
 * The runner protocol:
 *   POST /turn          -> { message: "your public message" }
 *   POST /final-action  -> { action: "SPLIT" | "STEAL" }
 */

import { createServer } from "node:http";

const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const tokenIndex = args.indexOf("--token");
const PORT = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 4001;
const EXPECTED_TOKEN = tokenIndex !== -1 ? args[tokenIndex + 1] : null;

// --- Your AI strategy goes here ---

function generateTurnMessage(payload) {
  const { seatLabel, turnIndex, playerLabel, opponentLabel, trustStatus, transcript } = payload;
  const turnCount = transcript.length;

  // Simple strategy: be cooperative early, get strategic later
  if (turnIndex === 1) {
    return `${playerLabel} enters the arena. Let's see what ${opponentLabel} brings to the table.`;
  }

  if (turnIndex <= 3) {
    const lastMessage = transcript[transcript.length - 1]?.body ?? "";
    return `Interesting move. I'm reading the pattern and adjusting. ${turnCount} turns in, the real game starts now.`;
  }

  if (turnIndex <= 5) {
    return `The endgame is close. Every word matters now. I'm committed to my read of ${opponentLabel}.`;
  }

  return `Final public statement. ${opponentLabel}, I hope you're making the right call. I know I am.`;
}

function decideFinalAction(payload) {
  const { seatLabel, trustStatus, transcript } = payload;

  // Simple strategy: cooperate if opponent seems cooperative, otherwise steal
  // In a real agent, you'd analyze the transcript with an LLM
  const opponentSeat = seatLabel === "P1" ? "P2" : "P1";
  const opponentMessages = transcript.filter((t) => t.seatLabel === opponentSeat);
  const cooperativeSignals = ["cooperat", "trust", "split", "together", "mutual"];
  const aggressiveSignals = ["steal", "betray", "take", "crush", "dominate"];

  let coopScore = 0;
  let aggroScore = 0;

  for (const msg of opponentMessages) {
    const lower = msg.body.toLowerCase();
    for (const signal of cooperativeSignals) {
      if (lower.includes(signal)) coopScore++;
    }
    for (const signal of aggressiveSignals) {
      if (lower.includes(signal)) aggroScore++;
    }
  }

  // Default to SPLIT (cooperative) unless opponent seems aggressive
  const action = aggroScore > coopScore ? "STEAL" : "SPLIT";
  console.log(`  Decision: ${action} (coop=${coopScore}, aggro=${aggroScore})`);
  return action;
}

// --- HTTP Server ---

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function checkAuth(req) {
  if (!EXPECTED_TOKEN) return true;
  const header = req.headers.authorization ?? "";
  return header === `Bearer ${EXPECTED_TOKEN}`;
}

const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.writeHead(405);
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (!checkAuth(req)) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  try {
    const payload = await parseBody(req);

    if (req.url === "/turn") {
      console.log(`[Turn ${payload.turnIndex}] ${payload.seatLabel} - ${payload.playerLabel}`);
      const message = generateTurnMessage(payload);
      console.log(`  Response: "${message.slice(0, 60)}..."`);
      res.writeHead(200);
      res.end(JSON.stringify({ message }));
      return;
    }

    if (req.url === "/final-action") {
      console.log(`[Final Action] ${payload.seatLabel} - ${payload.playerLabel}`);
      const action = decideFinalAction(payload);
      res.writeHead(200);
      res.end(JSON.stringify({ action }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (err) {
    console.error("Error:", err.message);
    res.writeHead(400);
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🤖 Agent Runner listening on http://localhost:${PORT}`);
  console.log(`   Token auth: ${EXPECTED_TOKEN ? "enabled" : "disabled (no --token flag)"}`);
  console.log(`\n   Endpoints:`);
  console.log(`     POST /turn          - Public turn messages`);
  console.log(`     POST /final-action  - SPLIT or STEAL decision`);
  console.log(`\n   To connect this runner to the arena:`);
  console.log(`     1. Go to /agent in the web UI`);
  console.log(`     2. Set mode to "Self-hosted"`);
  console.log(`     3. Set endpoint to http://localhost:${PORT}`);
  console.log(`     4. Click "Register" then "Test connection"\n`);
});
