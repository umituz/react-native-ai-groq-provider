/**
 * Chat Generation Use Case
 * Simple stateless chat completion for single-turn conversations
 */

import type { GroqMessage, GroqGenerationConfig } from "../../domain/entities/groq.types";
import { DEFAULT_MODELS } from "../../domain/entities/groq.types";
import { groqHttpClient } from "../../infrastructure/http/groq-http-client";
import { RequestBuilder } from "../../shared/request-builder";
import { ResponseHandler } from "../../shared/response-handler";
import { Timer } from "../../shared/timer";
import { logger } from "../../shared/logger";

export interface ChatGenerationOptions {
  model?: string;
  generationConfig?: GroqGenerationConfig;
}

export async function chatGeneration(
  messages: GroqMessage[],
  options: ChatGenerationOptions = {}
): Promise<string> {
  const timer = new Timer();

  logger.debug("ChatGeneration", "Called", {
    model: options.model,
    messageCount: messages.length,
  });

  const request = RequestBuilder.buildChatRequest(messages, {
    model: options.model || DEFAULT_MODELS.TEXT,
    generationConfig: options.generationConfig,
  });

  logger.debug("ChatGeneration", "Sending request", {
    endpoint: "/v1/chat/completions",
    model: request.model,
  });

  timer.startApiCall();
  const response = await groqHttpClient.chatCompletion(request);
  timer.endApiCall();

  const result = timer.getResult();
  ResponseHandler.logResponse(logger, response, result.apiMs);

  const handled = ResponseHandler.handleResponse(response);

  logger.debug("ChatGeneration", "Complete", {
    totalDuration: Timer.format(result.totalMs),
    responseLength: handled.content.length,
  });

  return handled.content;
}
