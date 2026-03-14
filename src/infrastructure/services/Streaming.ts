/**
 * Streaming Service
 * Handles streaming responses from Groq API
 */

import type {
  GroqChatRequest,
  GroqMessage,
  GroqGenerationConfig,
} from "../../domain/entities";
import { groqHttpClient } from "./GroqClient";
import { DEFAULT_MODELS } from "../../domain/entities";

export interface StreamingCallbacks {
  /** Called when new content chunk is received */
  onChunk?: (chunk: string) => void;
  /** Called when streaming completes */
  onComplete?: (fullContent: string) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
}

export interface StreamingOptions {
  model?: string;
  generationConfig?: GroqGenerationConfig;
  callbacks?: StreamingCallbacks;
}

/**
 * Stream text generation from a prompt
 */
export async function* streaming(
  prompt: string,
  options: StreamingOptions = {}
): AsyncGenerator<string> {
  const model = options.model || DEFAULT_MODELS.TEXT;

  const messages: GroqMessage[] = [
    {
      role: "user",
      content: prompt,
    },
  ];

  const request: GroqChatRequest = {
    model,
    messages,
    temperature: options.generationConfig?.temperature || 0.7,
    max_tokens: options.generationConfig?.maxTokens || 1024,
    top_p: options.generationConfig?.topP,
  };

  try {
    for await (const chunk of groqHttpClient.chatCompletionStream(request)) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        options.callbacks?.onChunk?.(content);
        yield content;
      }
    }
    options.callbacks?.onComplete?.(await collectStreamContent(request));
  } catch (error) {
    options.callbacks?.onError?.(error as Error);
    throw error;
  }
}

/**
 * Stream chat generation from messages
 */
export async function* streamingChat(
  messages: GroqMessage[],
  options: StreamingOptions = {}
): AsyncGenerator<string> {
  const model = options.model || DEFAULT_MODELS.TEXT;

  const request: GroqChatRequest = {
    model,
    messages,
    temperature: options.generationConfig?.temperature || 0.7,
    max_tokens: options.generationConfig?.maxTokens || 1024,
    top_p: options.generationConfig?.topP,
  };

  try {
    for await (const chunk of groqHttpClient.chatCompletionStream(request)) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        options.callbacks?.onChunk?.(content);
        yield content;
      }
    }
    options.callbacks?.onComplete?.(await collectStreamContent(request));
  } catch (error) {
    options.callbacks?.onError?.(error as Error);
    throw error;
  }
}

/**
 * Collect full content from streaming (for onComplete callback)
 */
async function collectStreamContent(request: GroqChatRequest): Promise<string> {
  let fullContent = "";

  for await (const chunk of groqHttpClient.chatCompletionStream(request)) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullContent += content;
    }
  }

  return fullContent;
}
