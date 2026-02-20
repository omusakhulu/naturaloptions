/**
 * Safe JSON parsing utility.
 * Returns fallback value instead of throwing on malformed input.
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback

  try {
    return JSON.parse(jsonString) as T
  } catch {
    return fallback
  }
}
