import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/http/respond";
import { createRunnerToken, getPlayerByWallet } from "@/lib/services/players";

const requestSchema = z.object({
  walletAddress: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return badRequest("Invalid runner token request", parsed.error.flatten());
  }

  const player = getPlayerByWallet(parsed.data.walletAddress);

  if (!player) {
    return badRequest("Player must exist before issuing a runner token");
  }

  return NextResponse.json({
    ok: true,
    runnerToken: createRunnerToken()
  });
}
