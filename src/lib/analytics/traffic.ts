import connectDB from "@/lib/db";
import { SiteTrafficDaily } from "@/models";
import {
  ANALYTICS_PAGE_SECTIONS,
  labelForAnalyticsPath,
  normalizeAnalyticsPath,
} from "@/lib/analytics/page-paths";

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function recordPageView(rawPath: string): Promise<void> {
  const path = normalizeAnalyticsPath(rawPath);
  if (!path) return;

  await connectDB();
  const day = startOfUtcDay();

  await SiteTrafficDaily.findOneAndUpdate(
    { day, path },
    { $inc: { views: 1 } },
    { upsert: true }
  );
}

export type TrafficPeriod = 7 | 30 | 90;

export type TrafficRow = {
  path: string;
  label: string;
  views: number;
};

export type TrafficSummary = {
  periodDays: TrafficPeriod;
  totalViews: number;
  rows: TrafficRow[];
  trackingSince: string | null;
};

export async function getTrafficSummary(periodDays: TrafficPeriod): Promise<TrafficSummary> {
  await connectDB();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (periodDays - 1));
  since.setUTCHours(0, 0, 0, 0);

  const aggregated = await SiteTrafficDaily.aggregate<{ _id: string; views: number }>([
    { $match: { day: { $gte: since } } },
    { $group: { _id: "$path", views: { $sum: "$views" } } },
  ]);

  const viewMap = new Map(aggregated.map((row) => [row._id, row.views]));
  const knownPaths = new Set<string>();

  const rows: TrafficRow[] = ANALYTICS_PAGE_SECTIONS.map((section) => {
    knownPaths.add(section.path);
    return {
      path: section.path,
      label: section.label,
      views: viewMap.get(section.path) ?? 0,
    };
  });

  let otherViews = 0;
  for (const row of aggregated) {
    if (!knownPaths.has(row._id)) {
      otherViews += row.views;
    }
  }
  if (otherViews > 0) {
    rows.push({ path: "/other", label: labelForAnalyticsPath("/other"), views: otherViews });
  }

  rows.sort((a, b) => b.views - a.views);

  const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
  const earliest = await SiteTrafficDaily.findOne().sort({ day: 1 }).select("day").lean();

  return {
    periodDays,
    totalViews,
    rows,
    trackingSince: earliest?.day ? new Date(earliest.day).toISOString() : null,
  };
}
