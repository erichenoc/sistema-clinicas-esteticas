/**
 * Sanitizes error messages before returning them to the client.
 *
 * In development, returns the full error message for easier debugging.
 * In production, returns a generic fallback message to avoid leaking
 * internal database schema, column names, constraint names, or other
 * sensitive infrastructure details to the client.
 *
 * Always logs the full error server-side for observability.
 */
export function sanitizeError(error: unknown, fallbackMessage: string): string {
  if (process.env.NODE_ENV === 'development') {
    // In development, show full error for debugging
    return error instanceof Error ? error.message : String(error) || fallbackMessage
  }
  // In production, log the full error server-side and return a safe generic message
  console.error('[Server Action Error]:', error)
  return fallbackMessage
}
