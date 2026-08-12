/** Convert Mongoose documents and Dates to plain JSON-safe objects for Server Components. */
export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
