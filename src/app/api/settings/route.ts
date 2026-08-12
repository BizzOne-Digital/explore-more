import connectDB from "@/lib/db";
import { SiteSettings } from "@/models";
import { COMPANY } from "@/lib/constants";
import { jsonOk } from "@/lib/api/response";

export async function GET() {
  await connectDB();

  let settings = await SiteSettings.findOne();

  if (!settings) {
    settings = await SiteSettings.create({
      companyName: COMPANY.name,
      email: COMPANY.email,
      phone: COMPANY.phone,
      stripeEnabled: false,
      manualOrderMode: false,
      introEnabled: true,
      verifiedStats: { showStats: false },
    });
  }

  return jsonOk({
    companyName: settings.companyName,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    operatingHours: settings.operatingHours,
    socialLinks: settings.socialLinks,
    logoUrl: settings.logoUrl,
    logoDarkUrl: settings.logoDarkUrl,
    faviconUrl: settings.faviconUrl,
    stripeEnabled: settings.stripeEnabled,
    manualOrderMode: settings.manualOrderMode,
    taxRatePercent: settings.taxRatePercent,
    shippingFlatCents: settings.shippingFlatCents,
    freeShippingThresholdCents: settings.freeShippingThresholdCents,
    introEnabled: settings.introEnabled,
    verifiedStats: settings.verifiedStats,
    upcomingEventLink: settings.upcomingEventLink,
  });
}
