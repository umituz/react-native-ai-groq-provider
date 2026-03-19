/**
 * Structured Generation Use Case
 * Generates structured JSON output from prompts
 * Optimized for performance
 */

import type { GroqGenerationConfig } from "../../domain/entities/groq.types";
import { groqHttpClient } from "../../infrastructure/http/groq-http-client";
import { RequestBuilder } from "../../shared/request-builder";
import { Timer } from "../../shared/timer";
import { logger } from "../../shared/logger";
import { ResponseHandler } from "../../shared/response-handler";
import { GroqError, GroqErrorType } from "../../domain/entities/error.types";
import { cleanJsonResponse } from "../../infrastructure/utils/content-mapper.util";

const MAX_CONTENT_LENGTH_FOR_ERROR = 200;

export interface StructuredGenerationOptions<T> {
  model?: string;
  generationConfig?: GroqGenerationConfig;
  schema?: Record<string, unknown>;
  example?: T;
}

export async function generateStructured<T = Record<string, unknown>>(
  prompt: string,
  options: StructuredGenerationOptions<T> = {}
): Promise<T> {
  const timer = new Timer();

  logger.debug("StructuredGeneration", "Called", {
    model: options.model,
    hasSchema: !!options.schema,
    hasExample: !!options.example,
  });

  const systemPrompt = buildSystemPrompt(options.schema, options.example);
  const request = RequestBuilder.buildSystemPromptRequest(systemPrompt, prompt, {
    ...options,
    defaultTemperature: 0.3,
    defaultMaxTokens: 2048,
  });

  timer.startApiCall();
  const response = await groqHttpClient.chatCompletion(request);
  timer.endApiCall();

  const result = timer.getResult();
  logger.debug("StructuredGeneration", "API response", {
    apiDuration: Timer.format(result.apiMs),
  });

  let content = ResponseHandler.extractContent(response);
  content = cleanJsonResponse(content);

  logger.debug("StructuredGeneration", "Parsing JSON");

  try {
    const parsed = JSON.parse(content) as T;

    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error("Response is not a valid object");
    }

    logger.debug("StructuredGeneration", "Complete", {
      totalDuration: Timer.format(result.totalMs),
      parsedKeys: Object.keys(parsed),
    });

    return parsed;
  } catch (error) {
    logger.error("StructuredGeneration", "JSON parse failed", {
      error,
      contentLength: content.length,
    });

    const truncatedContent = content.length > MAX_CONTENT_LENGTH_FOR_ERROR
      ? content.substring(0, MAX_CONTENT_LENGTH_FOR_ERROR) + "..."
      : content;

    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      `Failed to parse JSON response: ${truncatedContent}`,
      error
    );
  }
}

function buildSystemPrompt<T>(
  schema?: Record<string, unknown>,
  example?: T
): string {
  let prompt = "You are a helpful assistant that generates valid JSON output.";

  if (schema || example) {
    prompt += "\n\nResponse requirements:";

    if (schema) {
      // Use compact JSON to reduce tokens and improve speed
      prompt += `\nSchema: ${JSON.stringify(schema)}`;
    }

    if (example) {
      prompt += `\nExample: ${JSON.stringify(example)}`;
    }
  }

  prompt += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks.";

  return prompt;
}
