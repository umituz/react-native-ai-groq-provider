/**
 * Text Generation Service
 * Handles basic text generation using Groq API
 */

import type {
  GroqChatRequest,
  GroqChatResponse,
  GroqMessage,
  GroqGenerationConfig,
} from "../../domain/entities";
import { groqHttpClient } from "./GroqClient";
import { DEFAULT_MODELS } from "../../domain/entities";
import { GroqError, GroqErrorType } from "../../domain/entities/error.types";

export interface TextGenerationOptions {
  model?: string;
  generationConfig?: GroqGenerationConfig;
}

/**
 * Generate text from a simple prompt
 */
export async function textGeneration(
  prompt: string,
  options: TextGenerationOptions = {}
): Promise<string> {
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
    n: options.generationConfig?.n,
    stop: options.generationConfig?.stop,
    frequency_penalty: options.generationConfig?.frequencyPenalty,
    presence_penalty: options.generationConfig?.presencePenalty,
  };

  const response = await groqHttpClient.chatCompletion(request);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      "No content generated from Groq API"
    );
  }

  return content;
}

/**
 * Generate text from an array of messages
 */
export async function chatGeneration(
  messages: GroqMessage[],
  options: TextGenerationOptions = {}
): Promise<string> {
  const model = options.model || DEFAULT_MODELS.TEXT;

  const request: GroqChatRequest = {
    model,
    messages,
    temperature: options.generationConfig?.temperature || 0.7,
    max_tokens: options.generationConfig?.maxTokens || 1024,
    top_p: options.generationConfig?.topP,
    n: options.generationConfig?.n,
    stop: options.generationConfig?.stop,
    frequency_penalty: options.generationConfig?.frequencyPenalty,
    presence_penalty: options.generationConfig?.presencePenalty,
  };

  const response = await groqHttpClient.chatCompletion(request);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      "No content generated from Groq API"
    );
  }

  return content;
}
