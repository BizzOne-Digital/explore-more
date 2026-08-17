/**
 * Migration script to update existing events to the new schema
 * Run with: npx ts-node scripts/migrate-events.ts
 */

import mongoose from "mongoose";
import { Event } from "../src/models/Event";

async function migrateEvents() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }
    
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Find all events
    const events = await Event.find({});
    console.log(`Found ${events.length} events to migrate`);

    let migratedCount = 0;

    for (const event of events) {
      const updates: any = {};

      // Migrate priceCents to eventType and priceAmount
      if (event.priceCents !== undefined) {
        updates.eventType = event.priceCents === 0 ? "free" : "paid";
        updates.priceAmount = event.priceCents / 100; // Convert cents to dollars
      }

      // Add default values for new fields if missing
      if (!event.startTime) {
        const startDate = new Date(event.startDate);
        updates.startTime = `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`;
      }

      if (!event.endTime) {
        const endDate = new Date(event.endDate);
        updates.endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
      }

      // Set publishedToWebsite based on status
      if (event.publishedToWebsite === undefined) {
        updates.publishedToWebsite = event.status === "published";
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await Event.updateOne({ _id: event._id }, { $set: updates });
        migratedCount++;
        console.log(`Migrated event: ${event.title}`);
      }
    }

    console.log(`\nMigration complete! Updated ${migratedCount} events.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateEvents();
