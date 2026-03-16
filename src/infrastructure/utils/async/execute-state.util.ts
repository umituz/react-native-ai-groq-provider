/**
 * Async State Utilities
 */

import {
  calculateExponentialBackoff,
  clamp,
} from "../calculation.util";

/**
 * State setters for async operations
 */
export interface AsyncStateSetters<T> {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setData?: (data: T | null) => void;
}

/**
 * Callbacks for async operations
 */
export interface AsyncCallbacks<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Execute async function with state management
 */
export async function executeWithState<T>(
  setters: AsyncStateSetters<T>,
  asyncFn: () => Promise<T>,
  callbacks?: AsyncCallbacks<T>
): Promise<T> {
  const { setLoading, setError, setData } = setters;

  try {
    setLoading(true);
    setError(null);

    const result = await asyncFn();

    setData?.(result);
    callbacks?.onSuccess?.(result);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    setError(errorMessage);
    callbacks?.onError?.(error as Error);
    throw error;
  } finally {
    setLoading(false);
  }
}

/**
 * Execute async function with retry logic and exponential backoff
 * @param asyncFn - Function to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delayMs - Initial delay in milliseconds (default: 1000)
 * @param signal - Optional AbortSignal to cancel retries
 */
export async function executeWithRetry<T>(
  asyncFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  signal?: AbortSignal
): Promise<T> {
  // Validate inputs
  if (maxRetries < 1) {
    throw new Error("maxRetries must be at least 1");
  }
  if (delayMs < 0) {
    throw new Error("delayMs must be non-negative");
  }

  let lastError: Error | null = null;
  const MAX_DELAY_MS = 30000; // Cap at 30 seconds

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Check if aborted
    if (signal?.aborted) {
      throw new Error("Retry operation was aborted");
    }

    try {
      return await asyncFn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        // Calculate exponential backoff delay using utility
        const delay = calculateExponentialBackoff(delayMs, attempt);
        const cappedDelay = clamp(delay, 0, MAX_DELAY_MS);

        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => resolve(), cappedDelay);

          signal?.addEventListener("abort", () => {
            clearTimeout(timeoutId);
            reject(new Error("Retry operation was aborted during delay"));
          }, { once: true });
        });
      }
    }
  }

  throw lastError;
}
