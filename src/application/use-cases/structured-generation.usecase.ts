/**
 * Structured Generation Use Case
 * Generates structured JSON output from prompts
 */

import type { GroqGenerationConfig, GroqMessage } from "../../domain/entities";
import { groqHttpClient } from "../../infrastructure/http";
import { RequestBuilder } from "../../shared/request-builder";
import { ResponseHandler } from "../../shared/response-handler";
import { Timer, logger } from "../../shared/logger";
import { GroqError, GroqErrorType } from "../../domain/entities/error.types";
import { cleanJsonResponse } from "../../utils/content-mapper.util";

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

    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      `Failed to parse JSON: ${content}`,
      error
    );
  }
}

function buildSystemPrompt<T>(
  schema?: Record<string, unknown>,
  example?: T
): string {
  let prompt = "You are a helpful assistant that generates valid JSON output.";

  if (schema) {
    prompt += `\n\nResponse must conform to this JSON schema:\n${JSON.stringify(schema, null, 2)}`;
  }

  if (example) {
    prompt += `\n\nExample response format:\n${JSON.stringify(example, null, 2)}`;
  }

  prompt += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks.";

  return prompt;
}
