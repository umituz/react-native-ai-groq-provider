/**
 * useOperationManager Hook
 * Manages async operations with loading, error, and success states
 */

import { useState, useCallback, useRef, useMemo } from "react";
import { getUserFriendlyError } from "../../infrastructure/utils/error-mapper.util";
import { telemetry } from "../../infrastructure/telemetry";

export interface OperationState<T> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
}

export interface UseOperationManagerOptions<T> {
  /** Initial data */
  initialData?: T | null;
  /** Callback when operation starts */
  onStart?: () => void;
  /** Callback when operation succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when operation fails */
  onError?: (error: string) => void;
}

/**
 * Hook for managing async operations
 * Optimized to prevent unnecessary re-renders
 */
export function useOperationManager<T = unknown>(
  options: UseOperationManagerOptions<T> = {}
) {
  // Memoize options to prevent unnecessary callback recreations
  const stableOptions = useMemo(() => options, [
    options.initialData,
    options.onStart,
    options.onSuccess,
    options.onError,
  ]);

  const [state, setState] = useState<OperationState<T>>({
    isLoading: false,
    error: null,
    data: stableOptions.initialData ?? null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const operationNameRef = useRef<string>("");

  const execute = useCallback(
    async <R = T,>(
      operationName: string,
      asyncFn: (signal?: AbortSignal) => Promise<R>,
      config?: { abortPrevious?: boolean }
    ): Promise<R> => {
      // Cancel previous operation if configured
      if (config?.abortPrevious && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      operationNameRef.current = operationName;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      telemetry.log(`${operationName}_start`);
      stableOptions.onStart?.();

      try {
        const result = await asyncFn(abortControllerRef.current.signal);

        setState((prev) => ({ ...prev, isLoading: false, data: result as unknown as T }));
        stableOptions.onSuccess?.(result as unknown as T);
        telemetry.log(`${operationName}_success`);

        return result;
      } catch (error) {
        const errorMessage = getUserFriendlyError(error);
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        stableOptions.onError?.(errorMessage);
        telemetry.log(`${operationName}_error`, { error: errorMessage });
        throw error;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [stableOptions]
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: null,
      data: stableOptions.initialData ?? null,
    }));
  }, [stableOptions.initialData]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    clearError,
    setData,
  };
}
