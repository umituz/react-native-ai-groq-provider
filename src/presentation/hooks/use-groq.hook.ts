/**
 * useGroq Hook
 * Main React hook for Groq text generation
 */

import { useState, useCallback, useRef } from "react";
import type { GroqGenerationConfig } from "../../domain/entities/groq.types";
import { generateText } from "../../application/use-cases/text-generation.usecase";
import { generateStructured } from "../../application/use-cases/structured-generation.usecase";
import { streamText } from "../../application/use-cases/streaming.usecase";
import { getUserFriendlyError } from "../../infrastructure/utils/error-mapper.util";

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

  // Use refs to avoid unnecessary re-creates and JSON.stringify
  const optionsRef = useRef(options);
  const callbacksRef = useRef({
    onStart: options.onStart,
    onSuccess: options.onSuccess,
    onError: options.onError,
  });

  // Update refs when options change
  if (options.model !== optionsRef.current.model) {
    optionsRef.current.model = options.model;
  }
  if (options.generationConfig !== optionsRef.current.generationConfig) {
    optionsRef.current.generationConfig = options.generationConfig;
  }
  if (options.onStart !== callbacksRef.current.onStart) {
    callbacksRef.current.onStart = options.onStart;
  }
  if (options.onSuccess !== callbacksRef.current.onSuccess) {
    callbacksRef.current.onSuccess = options.onSuccess;
  }
  if (options.onError !== callbacksRef.current.onError) {
    callbacksRef.current.onError = options.onError;
  }

  const generate = useCallback(
    async (prompt: string, config?: GroqGenerationConfig): Promise<string> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      callbacksRef.current.onStart?.();

      try {
        const response = await generateText(prompt, {
          model: optionsRef.current.model,
          generationConfig: {
            ...optionsRef.current.generationConfig,
            ...config,
          },
        });

        setResult(response);
        callbacksRef.current.onSuccess?.(response);
        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        callbacksRef.current.onError?.(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [] // No deps - uses refs
  );

  const generateJSON = useCallback(
    async <T = Record<string, unknown>,>(
      prompt: string,
      config?: GroqGenerationConfig & { schema?: Record<string, unknown> }
    ): Promise<T> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      callbacksRef.current.onStart?.();

      try {
        const response = await generateStructured<T>(prompt, {
          model: optionsRef.current.model,
          generationConfig: {
            ...optionsRef.current.generationConfig,
            ...config,
          },
          schema: config?.schema,
        });

        const jsonStr = JSON.stringify(response, null, 2);
        setResult(jsonStr);
        callbacksRef.current.onSuccess?.(jsonStr);
        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        callbacksRef.current.onError?.(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [] // No deps - uses refs
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

      callbacksRef.current.onStart?.();

      try {
        for await (const chunk of streamText(prompt, {
          model: optionsRef.current.model,
          generationConfig: {
            ...optionsRef.current.generationConfig,
            ...config,
          },
          callbacks: { onChunk: (c) => {
            fullContent += c;
            onChunk(c);
          }},
        })) {
          fullContent += chunk;
        }

        setResult(fullContent);
        callbacksRef.current.onSuccess?.(fullContent);
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        callbacksRef.current.onError?.(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [] // No deps - uses refs
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
