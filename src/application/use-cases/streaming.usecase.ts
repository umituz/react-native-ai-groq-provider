/**
 * Streaming Use Case
 * Handles streaming text generation
 */

import type { GroqGenerationConfig } from "../../domain/entities/groq.types";
import { streamChatCompletion } from "../../infrastructure/http/streaming-client";
import { RequestBuilder } from "../../shared/request-builder";
import { logger } from "../../shared/logger";
import { groqHttpClient } from "../../infrastructure/http/groq-http-client";

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

  if (!groqHttpClient.isInitialized()) {
    throw new Error("Groq client not initialized. Call initializeProvider() first.");
  }

  const config = groqHttpClient.getConfig();
  const request = RequestBuilder.buildPromptRequest(prompt, options);

  let fullContent = "";

  try {
    for await (const chunk of streamChatCompletion(request, {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs,
    })) {
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
