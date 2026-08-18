/**
 * Normalize a MongoDB ref that may be populated or a raw ObjectId.
 */
export function resolveMongoId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

export function buildPartialUpdate<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[]
): Partial<T> {
  const update: Partial<T> = {};
  for (const field of fields) {
    if (body[field] !== undefined) {
      update[field] = body[field];
    }
  }
  return update;
}
