import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/market";

export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");

  try {
    const snapshot = await getMarketSnapshot(date);
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}
