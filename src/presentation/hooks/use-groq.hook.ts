/**
 * useGroq Hook
 * Main React hook for Groq text generation
 */

import { useState, useCallback, useMemo } from "react";
import type { GroqGenerationConfig } from "../../domain/entities";
import { generateText, generateStructured, streamText } from "../../application/use-cases";
import { getUserFriendlyError } from "../../utils/error-mapper.util";

export interface UseGroqOptions {
  model?: string;
  generationConfig?: GroqGenerationConfig;
  onStart?: () => void;
  onSuccess?: (result: string) => void;
  onError?: (error: string) => void;
}

export interface UseGroqReturn {
  isLoading: boolean;
  error: string | null;
  result: string | null;
  generate: (prompt: string, config?: GroqGenerationConfig) => Promise<string>;
  generateJSON: <T = Record<string, unknown>>(
    prompt: string,
    config?: GroqGenerationConfig & { schema?: Record<string, unknown> }
  ) => Promise<T>;
  stream: (
    prompt: string,
    onChunk: (chunk: string) => void,
    config?: GroqGenerationConfig
  ) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

export function useGroq(options: UseGroqOptions = {}): UseGroqReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const stableOptions = useMemo(
    () => ({
      model: options.model,
      generationConfig: options.generationConfig,
      onStart: options.onStart,
      onSuccess: options.onSuccess,
      onError: options.onError,
    }),
    [
      options.model,
      options.generationConfig?.temperature,
      options.generationConfig?.maxTokens,
      options.generationConfig?.topP,
      options.onStart,
      options.onSuccess,
      options.onError,
    ]
  );

  const generate = useCallback(
    async (prompt: string, config?: GroqGenerationConfig): Promise<string> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      stableOptions.onStart?.();

      try {
        const response = await generateText(prompt, {
          model: stableOptions.model,
          generationConfig: { ...stableOptions.generationConfig, ...config },
        });

        setResult(response);
        stableOptions.onSuccess?.(response);
        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        stableOptions.onError?.(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [stableOptions]
  );

  const generateJSON = useCallback(
    async <T = Record<string, unknown>,>(
      prompt: string,
      config?: GroqGenerationConfig & { schema?: Record<string, unknown> }
    ): Promise<T> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      stableOptions.onStart?.();

      try {
        const response = await generateStructured<T>(prompt, {
          model: stableOptions.model,
          generationConfig: { ...stableOptions.generationConfig, ...config },
          schema: config?.schema,
        });

        const jsonStr = JSON.stringify(response, null, 2);
        setResult(jsonStr);
        stableOptions.onSuccess?.(jsonStr);
        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        stableOptions.onError?.(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
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
      setIsLoading(true);
      setError(null);
      setResult(null);

      let fullContent = "";

      stableOptions.onStart?.();

      try {
        for await (const chunk of streamText(prompt, {
          model: stableOptions.model,
          generationConfig: { ...stableOptions.generationConfig, ...config },
          callbacks: { onChunk: (c) => {
            fullContent += c;
            onChunk(c);
          }},
        })) {
          // Consume iterator
        }

        setResult(fullContent);
        stableOptions.onSuccess?.(fullContent);
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        stableOptions.onError?.(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [stableOptions]
  );

  const reset = useCallback(() => {
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
