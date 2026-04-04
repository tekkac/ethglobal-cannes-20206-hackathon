import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/http/respond";
import { joinMatch } from "@/lib/services/matches";

const joinMatchSchema = z.object({
  walletAddress: z.string().min(1)
});

type Params = Promise<{ id: string }>;

export async function POST(
  request: NextRequest,
  context: { params: Params }
) {
  const parsed = joinMatchSchema.safeParse(await request.json());

  if (!parsed.success) {
    return badRequest("Invalid join match payload", parsed.error.flatten());
  }

  const { id } = await context.params;
  const result = joinMatch(id, parsed.data.walletAddress);

  if ("error" in result && result.error) {
    return badRequest(result.error);
  }

  return NextResponse.json({
    ok: true,
    match: result.match
  });
}
