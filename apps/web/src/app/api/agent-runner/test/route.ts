import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/http/respond";
import { testRunner } from "@/lib/services/players";

const requestSchema = z.object({
  walletAddress: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return badRequest("Invalid runner test payload", parsed.error.flatten());
  }

  const runner = testRunner(parsed.data.walletAddress);

  if (!runner) {
    return badRequest("Runner must exist before testing");
  }

  return NextResponse.json({
    ok: true,
    runner
  });
}
