/**
 * Text Generation Service
 * Handles basic text generation using Groq API
 */

import type {
  GroqChatRequest,
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
  const startTime = Date.now();
  const model = options.model || DEFAULT_MODELS.TEXT;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] textGeneration called:", {
      model,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + "...",
      options: options.generationConfig,
    });
  }

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

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] Sending request to API:", {
      endpoint: "/v1/chat/completions",
      requestBody: {
        model: request.model,
        messageCount: request.messages.length,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      },
    });
  }

  const apiStartTime = Date.now();
  const response = await groqHttpClient.chatCompletion(request);
  const apiDuration = Date.now() - apiStartTime;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] API response received:", {
      apiDuration: `${apiDuration}ms`,
      hasChoices: !!response.choices?.length,
      choiceCount: response.choices?.length || 0,
      usage: response.usage,
      finishReason: response.choices?.[0]?.finish_reason,
    });
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      "No content generated from Groq API"
    );
  }

  const totalDuration = Date.now() - startTime;
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] textGeneration complete:", {
      totalDuration: `${totalDuration}ms`,
      responseLength: content.length,
      responsePreview: content.substring(0, 200) + "...",
    });
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
  const startTime = Date.now();
  const model = options.model || DEFAULT_MODELS.TEXT;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] chatGeneration called:", {
      model,
      messageCount: messages.length,
      options: options.generationConfig,
    });
  }

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

  const apiStartTime = Date.now();
  const response = await groqHttpClient.chatCompletion(request);
  const apiDuration = Date.now() - apiStartTime;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] chatGeneration API response:", {
      apiDuration: `${apiDuration}ms`,
      usage: response.usage,
      finishReason: response.choices?.[0]?.finish_reason,
    });
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      "No content generated from Groq API"
    );
  }

  const totalDuration = Date.now() - startTime;
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] chatGeneration complete:", {
      totalDuration: `${totalDuration}ms`,
      responseLength: content.length,
    });
  }

  return content;
}
