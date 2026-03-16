/**
 * useGroq Hook
 * Main React hook for Groq text generation
 */

import { useState, useCallback, useRef, useMemo } from "react";
import type { GroqGenerationConfig } from "../../domain/entities";
import { textGeneration } from "../../infrastructure/services/TextGeneration";
import { structuredText } from "../../infrastructure/services/StructuredText";
import { streaming } from "../../infrastructure/services/Streaming";
import { getUserFriendlyError } from "../../infrastructure/utils/error-mapper.util";
import { telemetry } from "../../infrastructure/telemetry";

export interface UseGroqOptions {
  /** Initial model to use */
  model?: string;
  /** Default generation config */
  generationConfig?: GroqGenerationConfig;
  /** Callback when generation starts */
  onStart?: () => void;
  /** Callback when generation completes */
  onSuccess?: (result: string) => void;
  /** Callback when generation fails */
  onError?: (error: string) => void;
}

export interface UseGroqReturn {
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Generated result */
  result: string | null;
  /** Generate text from a prompt */
  generate: (prompt: string, options?: GroqGenerationConfig) => Promise<string>;
  /** Generate structured JSON output */
  generateJSON: <T = Record<string, unknown>>(
    prompt: string,
    options?: GroqGenerationConfig & { schema?: Record<string, unknown> }
  ) => Promise<T>;
  /** Stream text generation */
  stream: (
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: GroqGenerationConfig
  ) => Promise<void>;
  /** Reset state */
  reset: () => void;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook for Groq text generation
 * Optimized to prevent unnecessary re-renders and memory leaks
 */
export function useGroq(options: UseGroqOptions = {}): UseGroqReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize options to prevent unnecessary callback recreations
  const stableOptions = useMemo(() => options, [
    options.model,
    options.generationConfig?.temperature,
    options.generationConfig?.maxTokens,
    options.generationConfig?.topP,
    options.onStart,
    options.onSuccess,
    options.onError,
  ]);

  const generate = useCallback(
    async (prompt: string, config?: GroqGenerationConfig): Promise<string> => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);
      setResult(null);

      telemetry.log("groq_generate_start", { prompt: prompt.substring(0, 100) });
      stableOptions.onStart?.();

      try {
        const response = await textGeneration(prompt, {
          model: stableOptions.model,
          generationConfig: { ...stableOptions.generationConfig, ...config },
        });

        setResult(response);
        stableOptions.onSuccess?.(response);
        telemetry.log("groq_generate_success", { responseLength: response.length });

        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        stableOptions.onError?.(errorMessage);
        telemetry.log("groq_generate_error", { error: errorMessage });
        throw err;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [stableOptions]
  );

  const generateJSON = useCallback(
    async <T = Record<string, unknown>,>(
      prompt: string,
      config?: GroqGenerationConfig & { schema?: Record<string, unknown> }
    ): Promise<T> => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);
      setResult(null);

      telemetry.log("groq_generate_json_start", { prompt: prompt.substring(0, 100) });
      stableOptions.onStart?.();

      try {
        const response = await structuredText<T>(prompt, {
          model: stableOptions.model,
          generationConfig: { ...stableOptions.generationConfig, ...config },
          schema: config?.schema,
        });

        setResult(JSON.stringify(response, null, 2));
        stableOptions.onSuccess?.(JSON.stringify(response, null, 2));
        telemetry.log("groq_generate_json_success");

        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        stableOptions.onError?.(errorMessage);
        telemetry.log("groq_generate_json_error", { error: errorMessage });
        throw err;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [stableOptions]
  );

  const stream = useCallback(
    async (
      prompt: string,
      onChunk: (chunk: string) => void,
      config?: GroqGenerationConfig
    ): Promise<void> => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);
      setResult(null);

      let fullContent = "";

      telemetry.log("groq_stream_start", { prompt: prompt.substring(0, 100) });
      stableOptions.onStart?.();

      try {
        for await (const streamingResult of streaming(prompt, {
          model: stableOptions.model,
          generationConfig: { ...stableOptions.generationConfig, ...config },
          callbacks: {
            onChunk: (c) => {
              fullContent += c;
              onChunk(c);
            },
          },
        })) {
          // Consume the async iterator (streaming is handled via callbacks)
          void streamingResult;
        }

        setResult(fullContent);
        stableOptions.onSuccess?.(fullContent);
        telemetry.log("groq_stream_success", { contentLength: fullContent.length });
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        stableOptions.onError?.(errorMessage);
        telemetry.log("groq_stream_error", { error: errorMessage });
        throw err;
      } finally {
        setIsLoading(false);
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
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    result,
    generate,
    generateJSON,
    stream,
    reset,
    clearError,
  };
}
