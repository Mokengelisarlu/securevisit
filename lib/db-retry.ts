/**
 * Simple retry utility for database operations.
 *
 * Note: Drizzle wraps driver errors in a `DrizzleQueryError` whose original
 * cause lives on `error.cause` (and Neon's HTTP client puts the raw fetch
 * error on `cause.sourceError`). We walk that chain to detect transient
 * network failures worth retrying.
 */

const RETRYABLE_PATTERN =
  /timeout|fetch failed|network|socket hang up|terminated|ECONNRESET|ECONNREFUSED|ENETUNREACH|EHOSTUNREACH|ETIMEDOUT|EAI_AGAIN|UND_ERR/i;

function collectErrorText(error: unknown, depth = 0): string {
  if (!error || depth > 5) return "";
  const e = error as { message?: unknown; code?: unknown; cause?: unknown; sourceError?: unknown };
  const parts: string[] = [];
  if (typeof e.message === "string") parts.push(e.message);
  if (typeof e.code === "string") parts.push(e.code);
  return [...parts, collectErrorText(e.cause, depth + 1), collectErrorText(e.sourceError, depth + 1)]
    .filter(Boolean)
    .join(" | ");
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            const errorText = collectErrorText(error);
            const isTransient = RETRYABLE_PATTERN.test(errorText);

            if (!isTransient || i === retries - 1) {
                throw error;
            }

            console.warn(`Database connection attempt ${i + 1} failed (${errorText.split(" | ")[0]}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            // Exponential backoff
            delay *= 2;
        }
    }

    throw lastError;
}
