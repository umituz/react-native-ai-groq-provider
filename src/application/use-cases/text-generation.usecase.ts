/**
 * Text Generation Use Case
 * Handles simple text generation from prompts
 */

import type { GroqGenerationConfig } from "../../domain/entities";
import { groqHttpClient } from "../../infrastructure/http";
import { RequestBuilder } from "../../shared/request-builder";
import { ResponseHandler } from "../../shared/response-handler";
import { Timer, logger } from "../../shared";

export interface TextGenerationOptions {
  model?: string;
  generationConfig?: GroqGenerationConfig;
}

export async function generateText(
  prompt: string,
  options: TextGenerationOptions = {}
): Promise<string> {
  const timer = new Timer();

  logger.debug("TextGeneration", "Called", {
    model: options.model,
    promptLength: prompt.length,
  });

  const request = RequestBuilder.buildPromptRequest(prompt, options);

  logger.debug("TextGeneration", "Sending request", {
    endpoint: "/v1/chat/completions",
    model: request.model,
  });

  timer.startApiCall();
  const response = await groqHttpClient.chatCompletion(request);
  timer.endApiCall();

  const result = timer.getResult();
  ResponseHandler.logResponse(logger, response, result.apiMs);

  const handled = ResponseHandler.handleResponse(response);

  logger.debug("TextGeneration", "Complete", {
    totalDuration: Timer.format(result.totalMs),
    responseLength: handled.content.length,
  });

  return handled.content;
}
