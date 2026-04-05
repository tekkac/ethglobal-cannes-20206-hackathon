import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/http/respond";
import { upsertPlayer } from "@/lib/services/players";

const requestSchema = z.object({
  walletAddress: z.string().min(1),
  worldNullifierHash: z.string().min(1),
  merkleRoot: z.string().optional(),
  proof: z.string().optional(),
  verificationLevel: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return badRequest("Invalid verification payload", parsed.error.flatten());
  }

  // TODO: Call verifyCloudProof from @worldcoin/idkit-core/backend
  // when WORLDCOIN_APP_ID is configured for production.
  // For now, trust the client-submitted proof.

  const player = await upsertPlayer({
    walletAddress: parsed.data.walletAddress,
    trustStatus: "trusted",
    worldNullifierHash: parsed.data.worldNullifierHash,
  });

  return NextResponse.json({
    ok: true,
    player,
  });
}
