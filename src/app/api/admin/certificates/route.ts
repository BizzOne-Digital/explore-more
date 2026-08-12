import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Certificate } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";

export async function GET() {
  try {
    await connectDB();
    const items = await Certificate.find().sort({ createdAt: -1 }).lean();
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const item = await Certificate.create(body);
    return apiSuccess(item, 201);
  } catch (error) {
    return apiError(error);
  }
}
