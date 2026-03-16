/**
 * Structured Text Generation Service
 * Generates structured JSON output from Groq API
 */

import type {
  GroqChatRequest,
  GroqMessage,
  GroqGenerationConfig,
} from "../../domain/entities";
import { groqHttpClient } from "./GroqClient";
import { DEFAULT_MODELS } from "../../domain/entities";
import { GroqError, GroqErrorType } from "../../domain/entities/error.types";
import { cleanJsonResponse } from "../../infrastructure/utils/content-mapper.util";

export interface StructuredTextOptions<T> {
  model?: string;
  generationConfig?: GroqGenerationConfig;
  schema?: Record<string, unknown>;
  example?: T;
}

/**
 * Generate structured JSON output from a prompt
 */
export async function structuredText<T = Record<string, unknown>>(
  prompt: string,
  options: StructuredTextOptions<T> = {}
): Promise<T> {
  const startTime = Date.now();
  const model = options.model || DEFAULT_MODELS.TEXT;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] structuredText called:", {
      model,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 150) + "...",
      hasSchema: !!options.schema,
      hasExample: !!options.example,
      generationConfig: options.generationConfig,
    });
  }

  let systemPrompt = "You are a helpful assistant that generates valid JSON output.";

  if (options.schema) {
    systemPrompt += `\n\nResponse must conform to this JSON schema:\n${JSON.stringify(options.schema, null, 2)}`;
  }

  if (options.example) {
    systemPrompt += `\n\nExample response format:\n${JSON.stringify(options.example, null, 2)}`;
  }

  systemPrompt += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanations.";

  const messages: GroqMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const request: GroqChatRequest = {
    model,
    messages,
    temperature: options.generationConfig?.temperature || 0.3,
    max_tokens: options.generationConfig?.maxTokens || 2048,
    top_p: options.generationConfig?.topP || 0.9,
  };

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] Sending structured request:", {
      endpoint: "/v1/chat/completions",
      requestBody: {
        model: request.model,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
      },
    });
  }

  const apiStartTime = Date.now();
  const response = await groqHttpClient.chatCompletion(request);
  const apiDuration = Date.now() - apiStartTime;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] Structured API response:", {
      apiDuration: `${apiDuration}ms`,
      usage: response.usage,
      finishReason: response.choices?.[0]?.finish_reason,
      hasContent: !!response.choices?.[0]?.message?.content,
    });
  }

  let content = response.choices[0]?.message?.content;
  if (!content) {
    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      "No content generated from Groq API"
    );
  }

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] Raw response content:", {
      length: content.length,
      preview: content.substring(0, 300) + "...",
    });
  }

  content = cleanJsonResponse(content);

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] Attempting JSON parse...");
  }

  try {
    const parsed = JSON.parse(content) as T;
    const totalDuration = Date.now() - startTime;

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log("[Groq] structuredText complete:", {
        totalDuration: `${totalDuration}ms`,
        apiDuration: `${apiDuration}ms`,
        parseDuration: `${totalDuration - apiDuration}ms`,
        parsedKeys: Object.keys(parsed),
      });
    }

    return parsed;
  } catch (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.error("[Groq] JSON parse failed:", {
        error,
        contentLength: content.length,
        contentPreview: content.substring(0, 500) + "...",
      });
    }

    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      `Failed to parse JSON response: ${content}`,
      error
    );
  }
}

/**
 * Generate structured JSON output from messages
 */
export async function structuredChat<T = Record<string, unknown>>(
  messages: GroqMessage[],
  options: StructuredTextOptions<T> = {}
): Promise<T> {
  const startTime = Date.now();
  const model = options.model || DEFAULT_MODELS.TEXT;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] structuredChat called:", {
      model,
      messageCount: messages.length,
      hasSchema: !!options.schema,
      hasExample: !!options.example,
    });
  }

  let systemMessage: GroqMessage | null = null;

  // Check if there's already a system message
  const hasSystemMessage = messages.some((m) => m.role === "system");

  if (!hasSystemMessage) {
    let systemPrompt = "You are a helpful assistant that generates valid JSON output.";

    if (options.schema) {
      systemPrompt += `\n\nResponse must conform to this JSON schema:\n${JSON.stringify(options.schema, null, 2)}`;
    }

    if (options.example) {
      systemPrompt += `\n\nExample response format:\n${JSON.stringify(options.example, null, 2)}`;
    }

    systemPrompt += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanations.";

    systemMessage = {
      role: "system",
      content: systemPrompt,
    };
  }

  const requestMessages = systemMessage
    ? [systemMessage, ...messages]
    : messages;

  const request: GroqChatRequest = {
    model,
    messages: requestMessages,
    temperature: options.generationConfig?.temperature || 0.3,
    max_tokens: options.generationConfig?.maxTokens || 2048,
    top_p: options.generationConfig?.topP || 0.9,
  };

  const apiStartTime = Date.now();
  const response = await groqHttpClient.chatCompletion(request);
  const apiDuration = Date.now() - apiStartTime;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] structuredChat API response:", {
      apiDuration: `${apiDuration}ms`,
      usage: response.usage,
    });
  }

  let content = response.choices[0]?.message?.content;
  if (!content) {
    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      "No content generated from Groq API"
    );
  }

  content = cleanJsonResponse(content);

  const totalDuration = Date.now() - startTime;
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[Groq] structuredChat complete:", {
      totalDuration: `${totalDuration}ms`,
      responseLength: content.length,
    });
  }

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      `Failed to parse JSON response: ${content}`,
      error
    );
  }
}
