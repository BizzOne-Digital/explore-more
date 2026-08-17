import connectDB from "@/lib/db";
import { NewsletterSubscriber } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all"; // all, subscribed, unsubscribed, verified, unverified

    const query: Record<string, unknown> = {};

    // Apply status filters
    if (status === "subscribed") {
      query.unsubscribed = false;
    } else if (status === "unsubscribed") {
      query.unsubscribed = true;
    } else if (status === "verified") {
      query.verified = true;
      query.unsubscribed = false;
    } else if (status === "unverified") {
      query.verified = false;
    }

    // Apply search
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const items = await NewsletterSubscriber.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Check if subscriber already exists
    const existing = await NewsletterSubscriber.findOne({ email: body.email });
    if (existing) {
      return apiError(new Error("Email already subscribed"), 400);
    }

    const item = await NewsletterSubscriber.create({
      email: body.email,
      name: body.name || undefined,
      verified: body.verified ?? true, // Manual adds are verified by default
      unsubscribed: false,
    });

    return apiSuccess(item, 201);
  } catch (error) {
    return apiError(error);
  }
}
