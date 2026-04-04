import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/http/respond";
import { createMatch, listOpenMatches } from "@/lib/services/matches";

const createMatchSchema = z.object({
  walletAddress: z.string().min(1),
  stakeAmount: z.string().min(1)
});

export async function GET() {
  return NextResponse.json({
    ok: true,
    matches: listOpenMatches()
  });
}

export async function POST(request: NextRequest) {
  const parsed = createMatchSchema.safeParse(await request.json());

  if (!parsed.success) {
    return badRequest("Invalid create match payload", parsed.error.flatten());
  }

  const result = createMatch(parsed.data);

  if ("error" in result && result.error) {
    return badRequest(result.error);
  }

  return NextResponse.json({
    ok: true,
    match: result.match
  });
}
