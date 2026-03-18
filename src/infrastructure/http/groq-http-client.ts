/**
 * Groq HTTP Client
 * Core HTTP client for Groq API - simplified and focused
 */

import type {
  GroqConfig,
  GroqChatRequest,
  GroqChatResponse,
  GroqChatChunk,
} from "../../domain/entities";
import { GroqError, GroqErrorType, mapHttpStatusToErrorType } from "../../domain/entities/error.types";
import { logger } from "../../shared/logger";

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_TIMEOUT = 60000;

class GroqHttpClient {
  private config: GroqConfig | null = null;
  private initialized = false;

  initialize(config: GroqConfig): void {
    const apiKey = config.apiKey?.trim();

    logger.debug("GroqClient", "Initializing", {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
    });

    if (!apiKey || apiKey.length < 10) {
      throw new GroqError(
        GroqErrorType.INVALID_API_KEY,
        "API key is required and must be at least 10 characters"
      );
    }

    this.config = {
      apiKey,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      timeoutMs: config.timeoutMs || DEFAULT_TIMEOUT,
      textModel: config.textModel,
    };
    this.initialized = true;

    logger.debug("GroqClient", "Initialization complete", {
      initialized: this.initialized,
    });
  }

  isInitialized(): boolean {
    return this.initialized && this.config !== null;
  }

  getConfig(): GroqConfig {
    if (!this.config || !this.initialized) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        "Client not initialized"
      );
    }
    return this.config;
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    if (!this.config || !this.initialized) {
      throw new GroqError(GroqErrorType.MISSING_CONFIG, "Client not initialized");
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const timeout = this.config.timeoutMs || DEFAULT_TIMEOUT;

    logger.debug("GroqClient", "API Request", {
      endpoint,
      timeout: `${timeout}ms`,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (error) {
      throw this.handleRequestError(error);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}`;
    const errorType = mapHttpStatusToErrorType(response.status);

    try {
      const errorData = (await response.json()) as { error?: { message?: string } };
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // Use default message
    }

    throw new GroqError(errorType, errorMessage);
  }

  private handleRequestError(error: unknown): GroqError {
    if (error instanceof GroqError) return error;

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return new GroqError(GroqErrorType.ABORT_ERROR, "Request aborted", error);
      }
      if (error.message.includes("network")) {
        return new GroqError(GroqErrorType.NETWORK_ERROR, "Network error", error);
      }
    }

    return new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  async chatCompletion(request: GroqChatRequest): Promise<GroqChatResponse> {
    return this.request<GroqChatResponse>("/chat/completions", {
      ...request,
      stream: false,
    });
  }

  reset(): void {
    this.config = null;
    this.initialized = false;
  }
}

export const groqHttpClient = new GroqHttpClient();
