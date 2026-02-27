/**
 * Simple retry utility for database operations
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> {
    let lastError: any;

    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Check if it's a timeout or connection error
            const isTimeout = error.message?.includes("timeout") ||
                error.message?.includes("fetch failed") ||
                error.code === "UND_ERR_CONNECT_TIMEOUT";

            if (!isTimeout || i === retries - 1) {
                throw error;
            }

            console.warn(`Database connection attempt ${i + 1} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            // Exponential backoff
            delay *= 2;
        }
    }

    throw lastError;
}
