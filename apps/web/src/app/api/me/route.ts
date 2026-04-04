import { NextRequest, NextResponse } from "next/server";

import { badRequest } from "@/lib/http/respond";
import { getPlayerByWallet, getRunnerByWallet } from "@/lib/services/players";

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get("walletAddress");

  if (!walletAddress) {
    return badRequest("walletAddress is required");
  }

  const player = getPlayerByWallet(walletAddress);

  if (!player) {
    return NextResponse.json({
      ok: true,
      player: null,
      runner: null
    });
  }

  return NextResponse.json({
    ok: true,
    player,
    runner: getRunnerByWallet(walletAddress)
  });
}
