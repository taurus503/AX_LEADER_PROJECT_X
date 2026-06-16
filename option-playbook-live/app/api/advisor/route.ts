import { NextResponse } from "next/server";
import { buildAdvisorSnapshot, type AdvisorInputOverride } from "@/lib/oae";
import type { RegimeKey } from "@/lib/market";

export const runtime = "edge";

function parseNumber(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseRegimeKey(value: string | null): RegimeKey | undefined {
  if (value === "regime_1" || value === "regime_2" || value === "regime_3" || value === "regime_4") {
    return value;
  }
  return undefined;
}

function parseEventRisk(value: string | null): AdvisorInputOverride["eventRisk"] {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");

  const overrides: AdvisorInputOverride = {
    regimeKey: parseRegimeKey(url.searchParams.get("regimeKey")),
    regimeSubtitle: url.searchParams.get("regimeSubtitle") ?? undefined,
    volScore: parseNumber(url.searchParams.get("volScore")),
    skewScore: parseNumber(url.searchParams.get("skewScore")),
    confidence: parseNumber(url.searchParams.get("confidence")),
    eventRisk: parseEventRisk(url.searchParams.get("eventRisk")),
    sourceLabel: url.searchParams.get("sourceLabel") ?? undefined,
    codex2Brief: url.searchParams.get("codex2Brief") ?? undefined,
    selectedDate: date ?? undefined,
  };

  try {
    const snapshot = await buildAdvisorSnapshot(date, overrides);
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

