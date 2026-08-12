import { z } from "zod";
import connectDB from "@/lib/db";
import { NewsletterSubscriber } from "@/models";
import { generateToken } from "@/lib/password";
import { jsonOk, jsonError } from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
  consent: z.literal(true),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = rateLimit(`newsletter:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  if (!parsed.data.consent) {
    return jsonError("Explicit consent is required to subscribe");
  }

  await connectDB();

  const email = parsed.data.email.toLowerCase();
  const existing = await NewsletterSubscriber.findOne({ email });

  if (existing) {
    if (existing.unsubscribed) {
      existing.unsubscribed = false;
      existing.unsubscribedAt = undefined;
      existing.verified = true;
      if (parsed.data.name) existing.name = parsed.data.name;
      await existing.save();
      return jsonOk({ message: "Welcome back! You have been resubscribed." });
    }
    return jsonOk({ message: "You are already subscribed." });
  }

  await NewsletterSubscriber.create({
    email,
    name: parsed.data.name,
    verified: true,
    verificationToken: generateToken(),
    unsubscribed: false,
  });

  return jsonOk({ message: "Successfully subscribed to our newsletter." }, 201);
}
