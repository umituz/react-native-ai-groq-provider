/**
 * Streaming Use Case
 * Handles streaming text generation
 */

import type { GroqGenerationConfig } from "../../domain/entities";
import { streamChatCompletion } from "../../infrastructure/http";
import { RequestBuilder } from "../../shared/request-builder";
import { logger } from "../../shared/logger";

export interface StreamingCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export interface StreamingOptions {
  model?: string;
  generationConfig?: GroqGenerationConfig;
  callbacks?: StreamingCallbacks;
}

export async function* streamText(
  prompt: string,
  options: StreamingOptions = {}
): AsyncGenerator<string> {
  logger.debug("Streaming", "Starting", {
    model: options.model,
    promptLength: prompt.length,
  });

  const request = RequestBuilder.buildPromptRequest(prompt, options);
  const config = {
    apiKey: "", // Will be set by factory
    baseUrl: "", // Will be set by factory
  };

  let fullContent = "";

  try {
    for await (const chunk of streamChatCompletion(request, config)) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;
        options.callbacks?.onChunk?.(content);
        yield content;
      }
    }

    options.callbacks?.onComplete?.(fullContent);

    logger.debug("Streaming", "Complete", {
      totalLength: fullContent.length,
    });
  } catch (error) {
    options.callbacks?.onError?.(error as Error);
    throw error;
  }
}
