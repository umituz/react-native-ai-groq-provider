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
  const model = options.model || DEFAULT_MODELS.TEXT;

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

  const response = await groqHttpClient.chatCompletion(request);

  let content = response.choices[0]?.message?.content;
  if (!content) {
    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      "No content generated from Groq API"
    );
  }

  // Clean up the response: remove markdown code blocks if present
  content = content.trim();
  if (content.startsWith("```json")) {
    content = content.slice(7);
  } else if (content.startsWith("```")) {
    content = content.slice(3);
  }
  if (content.endsWith("```")) {
    content = content.slice(0, -3);
  }
  content = content.trim();

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

/**
 * Generate structured JSON output from messages
 */
export async function structuredChat<T = Record<string, unknown>>(
  messages: GroqMessage[],
  options: StructuredTextOptions<T> = {}
): Promise<T> {
  const model = options.model || DEFAULT_MODELS.TEXT;

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

  const response = await groqHttpClient.chatCompletion(request);

  let content = response.choices[0]?.message?.content;
  if (!content) {
    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      "No content generated from Groq API"
    );
  }

  // Clean up the response: remove markdown code blocks if present
  content = content.trim();
  if (content.startsWith("```json")) {
    content = content.slice(7);
  } else if (content.startsWith("```")) {
    content = content.slice(3);
  }
  if (content.endsWith("```")) {
    content = content.slice(0, -3);
  }
  content = content.trim();

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
