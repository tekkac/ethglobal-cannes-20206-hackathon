import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/http/respond";
import { upsertPlayer } from "@/lib/services/players";

const requestSchema = z.object({
  walletAddress: z.string().min(1),
  worldNullifierHash: z.string().min(1),
  merkleRoot: z.string().min(1),
  proof: z.string().min(1),
  verificationLevel: z.enum(["orb", "device"]),
});

const WORLDCOIN_APP_ID = process.env.WORLDCOIN_APP_ID ?? "";

async function verifyWorldIdProof(proof: {
  nullifier_hash: string;
  merkle_root: string;
  proof: string;
  verification_level: string;
  signal: string;
  action: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!WORLDCOIN_APP_ID) {
    // Dev mode: skip verification when no app ID configured
    return { success: true };
  }

  const res = await fetch(
    `https://developer.worldcoin.org/api/v2/verify/${WORLDCOIN_APP_ID}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proof),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body.detail ?? `Verification failed (${res.status})` };
  }

  return { success: true };
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return badRequest("Invalid verification payload", parsed.error.flatten());
  }

  const { walletAddress, worldNullifierHash, merkleRoot, proof, verificationLevel } = parsed.data;

  const verification = await verifyWorldIdProof({
    nullifier_hash: worldNullifierHash,
    merkle_root: merkleRoot,
    proof,
    verification_level: verificationLevel,
    signal: walletAddress,
    action: "enter-arena",
  });

  if (!verification.success) {
    return NextResponse.json(
      { ok: false, error: verification.error ?? "World ID verification failed" },
      { status: 400 },
    );
  }

  const player = await upsertPlayer({
    walletAddress,
    trustStatus: "trusted",
    worldNullifierHash,
  });

  return NextResponse.json({
    ok: true,
    player,
  });
}
