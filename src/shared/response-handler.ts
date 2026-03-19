/**
 * Response Handler Utility
 * Handles API response parsing and extraction
 */

import type { GroqChatResponse, GroqUsage, GroqFinishReason } from "../domain/entities/groq.types";

interface Logger {
  debug: (tag: string, message: string, context?: Record<string, unknown>) => void;
  isEnabled?: () => boolean;
}

export interface ResponseHandlerResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: GroqFinishReason;
}

export class ResponseHandler {
  /**
   * Extract content from chat completion response
   */
  static extractContent(response: GroqChatResponse): string {
    const choices = response.choices;
    if (!choices || choices.length === 0) {
      return "";
    }
    return choices[0].message?.content || "";
  }

  /**
   * Handle complete response and extract all relevant data
   */
  static handleResponse(response: GroqChatResponse): ResponseHandlerResult {
    const choices = response.choices;

    if (!choices || choices.length === 0) {
      return {
        content: "",
        usage: this.extractUsage(response.usage),
        finishReason: "stop",
      };
    }

    const choice = choices[0];
    return {
      content: choice.message?.content || "",
      usage: this.extractUsage(response.usage),
      finishReason: choice.finish_reason || "stop",
    };
  }

  /**
   * Extract usage information
   */
  private static extractUsage(usage: GroqUsage): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    return {
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    };
  }

  /**
   * Log response details (only if logger is enabled)
   */
  static logResponse(logger: Logger, response: GroqChatResponse, apiMs: number): void {
    // Early return if logging is disabled
    if (logger.isEnabled && !logger.isEnabled()) {
      return;
    }

    const choices = response.choices;
    const firstChoice = choices?.[0];

    logger.debug("ResponseHandler", "API response received", {
      model: response.model,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      finishReason: firstChoice?.finish_reason,
      apiDuration: `${apiMs}ms`,
    });
  }
}
