import { NextRequest, NextResponse } from "next/server";

import { getMatchDetail } from "@/lib/services/matches";

type Params = Promise<{ id: string }>;

export async function GET(_request: NextRequest, context: { params: Params }) {
  const { id } = await context.params;
  const match = await getMatchDetail(id);

  if (!match) {
    return NextResponse.json(
      {
        ok: false,
        error: "Match not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    match,
  });
}
