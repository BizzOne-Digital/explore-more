import { z } from "zod";
import connectDB from "@/lib/db";
import { NewsletterSubscriber, User } from "@/models";
import { jsonOk, jsonError } from "@/lib/api/response";

const unsubscribeSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Valid email is required");
  }

  await connectDB();

  const email = parsed.data.email.toLowerCase();
  const subscriber = await NewsletterSubscriber.findOne({ email });

  if (subscriber && !subscriber.unsubscribed) {
    subscriber.unsubscribed = true;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();
  }

  await User.updateMany(
    { email },
    { $set: { "notificationPreferences.newsletter": false } }
  );

  return jsonOk({ message: "You have been unsubscribed." });
}

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return jsonError("Email is required");
  }

  await connectDB();

  const subscriber = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });

  if (subscriber && !subscriber.unsubscribed) {
    subscriber.unsubscribed = true;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();
  }

  await User.updateMany(
    { email: email.toLowerCase() },
    { $set: { "notificationPreferences.newsletter": false } }
  );

  return jsonOk({ message: "You have been unsubscribed." });
}
