import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/http/respond";
import { registerRunner } from "@/lib/services/players";

const requestSchema = z.object({
  walletAddress: z.string().min(1),
  runnerLabel: z.string().min(1),
  mode: z.enum(["local", "self-hosted"]).default("local"),
  endpointUrl: z.string().url().optional(),
  runnerToken: z.string().min(1).optional()
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return badRequest("Invalid runner registration payload", parsed.error.flatten());
  }

  const runner = await registerRunner({
    walletAddress: parsed.data.walletAddress,
    runnerLabel: parsed.data.runnerLabel,
    mode: parsed.data.mode,
    endpointUrl: parsed.data.endpointUrl ?? null,
    runnerToken: parsed.data.runnerToken
  });

  if (!runner) {
    return badRequest("Player must exist before registering a runner");
  }

  return NextResponse.json({
    ok: true,
    runner
  });
}
