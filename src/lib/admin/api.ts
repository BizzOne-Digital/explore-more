import { NextResponse } from "next/server";
import mongoose from "mongoose";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function parseBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export function notFound(message = "Not found") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}
