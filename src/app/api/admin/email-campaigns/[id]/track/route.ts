import connectDB from "@/lib/db";
import { EmailCampaign } from "@/models";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");

    const campaign = await EmailCampaign.findById(id);
    if (!campaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    if (type === "open") {
      campaign.openedCount = (campaign.openedCount || 0) + 1;
      await campaign.save();

      const pixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64"
      );
      return new NextResponse(pixel, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    if (type === "click") {
      campaign.clickedCount = (campaign.clickedCount || 0) + 1;
      await campaign.save();

      const redirectUrl = searchParams.get("url");
      if (redirectUrl) {
        return NextResponse.redirect(redirectUrl);
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Tracking error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
