import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { DonationCampaign } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { sanitizeCampaignSlug } from "@/lib/campaign-slug";

export async function GET() {
  try {
    await connectDB();
    const items = await DonationCampaign.find().sort({ createdAt: -1 }).lean();
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const slug = sanitizeCampaignSlug(body.slug);
    if (!slug) {
      return apiError(new Error("Campaign slug is required"), 400);
    }
    const item = await DonationCampaign.create({ ...body, slug });
    return apiSuccess(item, 201);
  } catch (error) {
    return apiError(error);
  }
}
