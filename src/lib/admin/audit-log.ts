import { ActivityLog } from "@/models";
import type { Types } from "mongoose";

interface LogActivityParams {
  performedBy: string | Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  userId?: string | Types.ObjectId;
  changes?: Record<string, { old: unknown; new: unknown }>;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log admin activity for audit trail
 */
export async function logActivity(params: LogActivityParams) {
  try {
    await ActivityLog.create({
      performedBy: params.performedBy,
      userId: params.userId || params.entityId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      changes: params.changes,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

/**
 * Extract changes between old and new objects
 */
export function extractChanges(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  excludeFields: string[] = []
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  
  for (const key of allKeys) {
    if (excludeFields.includes(key)) continue;
    if (key.startsWith("_")) continue; // Skip internal fields
    
    const oldValue = oldObj[key];
    const newValue = newObj[key];
    
    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;
    
    changes[key] = {
      old: oldValue,
      new: newValue,
    };
  }
  
  return changes;
}

/**
 * Get IP address from request
 */
export function getIpAddress(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || undefined;
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined;
}
