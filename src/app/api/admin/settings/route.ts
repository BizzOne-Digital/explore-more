import connectDB from "@/lib/db";
import { SiteSettings } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { COMPANY } from "@/lib/constants";

export async function GET() {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne().lean();
    if (!settings) {
      settings = await SiteSettings.create({
        companyName: COMPANY.name,
        email: COMPANY.email,
        phone: COMPANY.phone,
      });
    }
    return apiSuccess(settings);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const settings = await SiteSettings.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
      runValidators: true,
    }).lean();
    return apiSuccess(settings);
  } catch (error) {
    return apiError(error);
  }
}
