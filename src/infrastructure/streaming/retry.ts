/** Thrown for failures that retrying cannot fix (4xx responses). */
export class RetryAbortError extends Error {}

export interface RetryOptions {
  retries: number;
  delayMs: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  retries: 3,
  delayMs: 1000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries, delayMs }: RetryOptions
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RetryAbortError) throw error;
      lastError = error;
      if (attempt < retries && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Fetch that rejects on non-ok responses with a resource-named message:
 * 4xx aborts immediately (RetryAbortError), everything else is retryable.
 */
export async function fetchOk(
  resourceLabel: string,
  url: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const message = `${resourceLabel} request failed: ${res.status}`;
    if (res.status >= 400 && res.status < 500) {
      throw new RetryAbortError(message);
    }
    throw new Error(message);
  }
  return res;
}
