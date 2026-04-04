import { NextRequest, NextResponse } from "next/server";

import { resolveEnsProfile } from "@/lib/services/ens";

type Params = Promise<{ address: string }>;

export async function GET(_request: NextRequest, context: { params: Params }) {
  const { address } = await context.params;

  const profile = await resolveEnsProfile(address);

  return NextResponse.json({
    ok: true,
    profile
  });
}
