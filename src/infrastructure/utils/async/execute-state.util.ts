/**
 * Async State Utilities
 */

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
 * Execute async function with retry logic
 */
export async function executeWithRetry<T>(
  asyncFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        // Wait before retrying with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}
