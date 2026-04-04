import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/http/respond";
import { claimMatchPayout, getMatchDetail } from "@/lib/services/matches";

const claimSchema = z.object({
  walletAddress: z.string().min(1),
});

type Params = Promise<{ id: string }>;

export async function POST(request: NextRequest, context: { params: Params }) {
  const parsed = claimSchema.safeParse(await request.json());

  if (!parsed.success) {
    return badRequest("Invalid claim payload", parsed.error.flatten());
  }

  const { id } = await context.params;
  const result = claimMatchPayout(id, parsed.data.walletAddress);

  if ("error" in result && result.error) {
    return badRequest(result.error);
  }

  const match = await getMatchDetail(id);

  return NextResponse.json({
    ok: true,
    claim: result,
    match,
  });
}
