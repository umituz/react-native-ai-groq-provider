/**
 * Groq HTTP Client
 * Core HTTP client for Groq API - simplified and focused
 */

import type {
  GroqConfig,
  GroqChatRequest,
  GroqChatResponse,
} from "../../domain/entities/groq.types";
import { GroqError, GroqErrorType, mapHttpStatusToErrorType } from "../../domain/entities/error.types";
import { logger } from "../../shared/logger";

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_TIMEOUT = 60000;
const MIN_API_KEY_LENGTH = 10;
const GROQ_KEY_PREFIX = "gsk_";

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

    if (!apiKey) {
      throw new GroqError(
        GroqErrorType.INVALID_API_KEY,
        "API key is required"
      );
    }

    if (apiKey.length < MIN_API_KEY_LENGTH) {
      throw new GroqError(
        GroqErrorType.INVALID_API_KEY,
        `API key must be at least ${MIN_API_KEY_LENGTH} characters`
      );
    }

    if (!apiKey.startsWith(GROQ_KEY_PREFIX)) {
      logger.warn("GroqClient", "API key does not start with expected prefix", {
        prefix: GROQ_KEY_PREFIX,
      });
    }

    this.config = {
      apiKey,
      baseUrl: this.normalizeBaseUrl(config.baseUrl),
      timeoutMs: this.validateTimeout(config.timeoutMs),
      textModel: config.textModel,
    };
    this.initialized = true;

    logger.debug("GroqClient", "Initialization complete", {
      initialized: this.initialized,
    });
  }

  private normalizeBaseUrl(baseUrl?: string): string {
    if (!baseUrl) {
      return DEFAULT_BASE_URL;
    }
    return baseUrl.replace(/\/+$/, ""); // Remove trailing slashes
  }

  private validateTimeout(timeout?: number): number {
    const DEFAULT = DEFAULT_TIMEOUT;
    if (timeout === undefined || timeout === null) {
      return DEFAULT;
    }
    if (!Number.isFinite(timeout) || timeout <= 0) {
      logger.warn("GroqClient", "Invalid timeout, using default", {
        provided: timeout,
        default: DEFAULT,
      });
      return DEFAULT;
    }
    return Math.min(timeout, 300000); // Cap at 5 minutes
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

      const text = await response.text();
      if (!text) {
        throw new GroqError(GroqErrorType.SERVER_ERROR, "Empty response from server");
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        throw new GroqError(
          GroqErrorType.SERVER_ERROR,
          `Invalid JSON response: ${text.substring(0, 200)}`
        );
      }
    } catch (error) {
      throw this.handleRequestError(error);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}`;
    const errorType = mapHttpStatusToErrorType(response.status);

    try {
      const text = await response.text();
      if (text) {
        try {
          const errorData = JSON.parse(text) as { error?: { message?: string } };
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // Use text content if JSON parsing fails
          errorMessage = text.substring(0, 500);
        }
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
        return new GroqError(GroqErrorType.ABORT_ERROR, "Request timeout", error);
      }
      if (error.name === "TypeError" && error.message.includes("network")) {
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
