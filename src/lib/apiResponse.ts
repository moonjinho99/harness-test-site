import { NextResponse } from "next/server";

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function ok<T>(data: T, init?: number | ResponseInit): NextResponse {
  return NextResponse.json<ApiEnvelope<T>>({ success: true, data }, typeof init === "number" ? { status: init } : init);
}

export function fail(error: string, status = 400): NextResponse {
  return NextResponse.json<ApiEnvelope<never>>({ success: false, error }, { status });
}