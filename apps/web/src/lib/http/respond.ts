import { NextResponse } from "next/server";

export function badRequest(error: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error,
      details: details ?? null,
    },
    { status: 400 },
  );
}

