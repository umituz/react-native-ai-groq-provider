/**
 * Streaming Client
 * Handles SSE streaming from Groq API
 */

import type { GroqChatRequest, GroqChatChunk } from "../../domain/entities/groq.types";
import { GroqError, GroqErrorType, mapHttpStatusToErrorType } from "../../domain/entities/error.types";
import { logger } from "../../shared/logger";

const DEFAULT_TIMEOUT = 60000;
const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB
const MAX_INCOMPLETE_CHUNKS = 10; // Max consecutive parse failures

export async function* streamChatCompletion(
  request: GroqChatRequest,
  config: { apiKey: string; baseUrl: string; timeoutMs?: number }
): AsyncGenerator<GroqChatChunk> {
  const client = new GroqStreamingClient();
  yield* client.stream(request, config);
}

class GroqStreamingClient {
  private normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, ""); // Remove trailing slashes
  }

  private validateTimeout(timeout?: number): number {
    if (timeout === undefined || timeout === null || timeout <= 0) {
      return DEFAULT_TIMEOUT;
    }
    return Math.min(timeout, 300000); // Cap at 5 minutes
  }

  async* stream(
    request: GroqChatRequest,
    config: { apiKey: string; baseUrl: string; timeoutMs?: number }
  ): AsyncGenerator<GroqChatChunk> {
    const baseUrl = this.normalizeBaseUrl(config.baseUrl);
    const url = `${baseUrl}/chat/completions`;
    const timeout = this.validateTimeout(config.timeoutMs);

    logger.debug("StreamingClient", "Starting stream", {
      model: request.model,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ ...request, stream: true }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      if (!response.body) {
        throw new GroqError(GroqErrorType.NETWORK_ERROR, "Response body is empty");
      }

      yield* this.parseSSE(response.body);

    } catch (error) {
      throw this.handleRequestError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async* parseSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<GroqChatChunk> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let consecutiveErrors = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Safe buffer management - only trim if necessary
        if (buffer.length > MAX_BUFFER_SIZE) {
          const keepSize = Math.floor(MAX_BUFFER_SIZE / 2);
          buffer = buffer.slice(-keepSize);
          logger.warn("StreamingClient", "Buffer trimmed due to size limit");
        }

        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            try {
              const jsonStr = trimmed.slice(6);
              const chunk = JSON.parse(jsonStr) as GroqChatChunk;
              consecutiveErrors = 0; // Reset error counter on success
              yield chunk;
            } catch (error) {
              consecutiveErrors++;
              logger.error("StreamingClient", "Failed to parse SSE chunk", {
                error,
                chunk: trimmed.substring(0, 100),
                consecutiveErrors,
              });

              // After too many consecutive errors, abort the stream
              if (consecutiveErrors >= MAX_INCOMPLETE_CHUNKS) {
                throw new GroqError(
                  GroqErrorType.SERVER_ERROR,
                  `Stream corrupted: ${consecutiveErrors} consecutive parse failures`
                );
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
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
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return new GroqError(GroqErrorType.NETWORK_ERROR, "Network error", error);
      }
    }

    return new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
