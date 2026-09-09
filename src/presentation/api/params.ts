import { NextResponse } from "next/server";

/** Parse a positive-integer route/query param, or null if it isn't one. */
export function parsePositiveInt(value: string | null | undefined): number | null {
  if (value === null || value === undefined || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n > 0 ? n : null;
}

/** Four-digit season year, or null. */
export function parseSeason(value: string | null | undefined): number | null {
  if (!value || !/^\d{4}$/.test(value)) return null;
  return Number(value);
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  return NextResponse.json({ error: message }, { status: 502 });
}
