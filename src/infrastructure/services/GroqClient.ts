/**
 * Groq HTTP Client
 * Handles all HTTP communication with Groq API
 */

import type {
  GroqConfig,
  GroqChatRequest,
  GroqChatResponse,
  GroqChatChunk,
} from "../../domain/entities";
import { GroqError, GroqErrorType, mapHttpStatusToErrorType } from "../../domain/entities/error.types";

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const CHAT_COMPLETIONS_ENDPOINT = "/chat/completions";

class GroqHttpClient {
  private config: GroqConfig | null = null;
  private initialized = false;

  /**
   * Initialize the client with configuration
   */
  initialize(config: GroqConfig): void {
    const apiKey = config.apiKey?.trim();

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log("[GroqClient] Initializing:", {
        hasApiKey: !!apiKey,
        keyLength: apiKey?.length,
        keyPrefix: apiKey ? apiKey.substring(0, 10) + "..." : "",
        baseUrl: config.baseUrl || DEFAULT_BASE_URL,
        timeoutMs: config.timeoutMs || DEFAULT_TIMEOUT,
        textModel: config.textModel,
      });
    }

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

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log("[GroqClient] Initialization complete:", {
        initialized: this.initialized,
        baseUrl: this.config.baseUrl,
      });
    }
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.config !== null;
  }

  /**
   * Get current configuration
   */
  getConfig(): GroqConfig {
    if (!this.config || !this.initialized) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        "Client not initialized. Call initialize() first."
      );
    }
    return this.config;
  }

  /**
   * Make an HTTP request to Groq API
   */
  private async request<T>(
    endpoint: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    if (!this.config || !this.initialized) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        "Client not initialized. Call initialize() first."
      );
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const timeout = this.config.timeoutMs || DEFAULT_TIMEOUT;

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log("[GroqClient] API Request:", {
        url,
        endpoint,
        method: "POST",
        timeout: `${timeout}ms`,
        hasBody: !!body,
        bodyKeys: body ? Object.keys(body) : [],
      });
    }

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Use provided signal if available
      if (signal) {
        signal.addEventListener("abort", () => controller.abort());
      }

      const fetchStartTime = Date.now();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const fetchDuration = Date.now() - fetchStartTime;
      clearTimeout(timeoutId);

      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log("[GroqClient] API Response:", {
          status: response.status,
          ok: response.ok,
          fetchDuration: `${fetchDuration}ms`,
          contentType: response.headers.get("content-type"),
        });
      }

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const jsonStart = Date.now();
      const jsonData = (await response.json()) as T;
      const parseDuration = Date.now() - jsonStart;

      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log("[GroqClient] JSON parsed:", {
          parseDuration: `${parseDuration}ms`,
          hasData: !!jsonData,
          dataKeys: jsonData ? Object.keys(jsonData) : [],
        });
      }

      return jsonData;
    } catch (error) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.error("[GroqClient] Request error:", {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : undefined,
        });
      }

      throw this.handleRequestError(error);
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}`;
    let errorType = mapHttpStatusToErrorType(response.status);

    try {
      const errorData = (await response.json()) as { error?: { message?: string } };
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // If parsing fails, use default message
    }

    throw new GroqError(errorType, errorMessage, {
      status: response.status,
      url: response.url,
    });
  }

  /**
   * Handle request errors (network, timeout, abort)
   */
  private handleRequestError(error: unknown): GroqError {
    if (error instanceof GroqError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return new GroqError(
          GroqErrorType.ABORT_ERROR,
          "Request was aborted by the client",
          error
        );
      }

      if (error.name === "TypeError" && error.message.includes("network")) {
        return new GroqError(
          GroqErrorType.NETWORK_ERROR,
          "Network error: Unable to connect to Groq API",
          error
        );
      }
    }

    return new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Unknown error occurred",
      error
    );
  }

  /**
   * Send chat completion request (non-streaming)
   */
  async chatCompletion(
    request: GroqChatRequest,
    signal?: AbortSignal
  ): Promise<GroqChatResponse> {
    return this.request<GroqChatResponse>(
      CHAT_COMPLETIONS_ENDPOINT,
      { ...request, stream: false },
      signal
    );
  }

  /**
   * Send chat completion request (streaming)
   * Returns an async generator of chunks
   */
  async *chatCompletionStream(
    request: GroqChatRequest,
    signal?: AbortSignal
  ): AsyncGenerator<GroqChatChunk> {
    if (!this.config || !this.initialized) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        "Client not initialized. Call initialize() first."
      );
    }

    const url = `${this.config.baseUrl}${CHAT_COMPLETIONS_ENDPOINT}`;
    const timeout = this.config.timeoutMs || DEFAULT_TIMEOUT;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Use provided signal if available
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ ...request, stream: true }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      if (!response.body) {
        throw new GroqError(
          GroqErrorType.NETWORK_ERROR,
          "Response body is null"
        );
      }

      // Read and parse Server-Sent Events
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6);
            try {
              const chunk = JSON.parse(jsonStr) as GroqChatChunk;
              yield chunk;
            } catch (error) {
              console.error("Failed to parse SSE chunk:", error);
            }
          }
        }
      }
    } catch (error) {
      throw this.handleRequestError(error);
    }
  }

  /**
   * Reset the client
   */
  reset(): void {
    this.config = null;
    this.initialized = false;
  }
}

/**
 * Singleton instance
 */
export const groqHttpClient = new GroqHttpClient();
