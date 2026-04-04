import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/http/respond";
import { upsertPlayer } from "@/lib/services/players";

const requestSchema = z.object({
  walletAddress: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return badRequest("Invalid untrusted player payload", parsed.error.flatten());
  }

  const player = await upsertPlayer({
    walletAddress: parsed.data.walletAddress,
    trustStatus: "untrusted"
  });

  return NextResponse.json({
    ok: true,
    player
  });
}
