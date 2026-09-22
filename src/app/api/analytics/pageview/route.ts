import { NextResponse } from "next/server";
import { z } from "zod";
import { recordPageView } from "@/lib/analytics/traffic";
import { normalizeAnalyticsPath } from "@/lib/analytics/page-paths";

const bodySchema = z.object({
  path: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (!normalizeAnalyticsPath(parsed.data.path)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await recordPageView(parsed.data.path);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Pageview record error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
