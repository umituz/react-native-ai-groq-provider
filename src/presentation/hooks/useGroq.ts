/**
 * useGroq Hook
 * Main React hook for Groq text generation
 */

import { useState, useCallback, useRef } from "react";
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
 */
export function useGroq(options: UseGroqOptions = {}): UseGroqReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
      options.onStart?.();

      try {
        const response = await textGeneration(prompt, {
          model: options.model,
          generationConfig: { ...options.generationConfig, ...config },
        });

        setResult(response);
        options.onSuccess?.(response);
        telemetry.log("groq_generate_success", { responseLength: response.length });

        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        options.onError?.(errorMessage);
        telemetry.log("groq_generate_error", { error: errorMessage });
        throw err;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [options]
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
      options.onStart?.();

      try {
        const response = await structuredText<T>(prompt, {
          model: options.model,
          generationConfig: { ...options.generationConfig, ...config },
          schema: config?.schema,
        });

        setResult(JSON.stringify(response, null, 2));
        options.onSuccess?.(JSON.stringify(response, null, 2));
        telemetry.log("groq_generate_json_success");

        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        options.onError?.(errorMessage);
        telemetry.log("groq_generate_json_error", { error: errorMessage });
        throw err;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [options]
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
      options.onStart?.();

      try {
        for await (const streamingResult of streaming(prompt, {
          model: options.model,
          generationConfig: { ...options.generationConfig, ...config },
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
        options.onSuccess?.(fullContent);
        telemetry.log("groq_stream_success", { contentLength: fullContent.length });
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        options.onError?.(errorMessage);
        telemetry.log("groq_stream_error", { error: errorMessage });
        throw err;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [options]
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
