import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/http/respond";
import { createSelfPlayMatch } from "@/lib/services/matches";

const schema = z.object({
  walletAddress: z.string().min(1),
  stakeAmount: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return badRequest("Invalid self-play payload", parsed.error.flatten());
  }

  const result = await createSelfPlayMatch(parsed.data);

  if ("error" in result && result.error) {
    return badRequest(result.error);
  }

  return NextResponse.json({
    ok: true,
    match: result.match,
  });
}
