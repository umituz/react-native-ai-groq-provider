/**
 * Streaming Client
 * Handles SSE streaming from Groq API
 */

import type { GroqChatRequest, GroqChatChunk } from "../../domain/entities";
import { GroqError, GroqErrorType, mapHttpStatusToErrorType } from "../../domain/entities/error.types";
import { logger } from "../../shared/logger";
import { calculateSafeBufferSize } from "../../utils/calculation.util";

const DEFAULT_TIMEOUT = 60000;

export async function* streamChatCompletion(
  request: GroqChatRequest,
  config: { apiKey: string; baseUrl: string; timeoutMs?: number }
): AsyncGenerator<GroqChatChunk> {
  const url = `${config.baseUrl}/chat/completions`;
  const timeout = config.timeoutMs || DEFAULT_TIMEOUT;

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
      await handleErrorResponse(response);
    }

    if (!response.body) {
      throw new GroqError(GroqErrorType.NETWORK_ERROR, "Response body is null");
    }

    yield* parseSSE(response.body);

  } catch (error) {
    throw handleRequestError(error);
  }
}

async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<GroqChatChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const MAX_BUFFER_SIZE = 1024 * 1024;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const safeSize = calculateSafeBufferSize(buffer.length, MAX_BUFFER_SIZE);
      if (safeSize < buffer.length) {
        buffer = buffer.slice(-safeSize);
      }

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;

        if (trimmed.startsWith("data: ")) {
          try {
            const chunk = JSON.parse(trimmed.slice(6)) as GroqChatChunk;
            yield chunk;
          } catch (error) {
            logger.error("StreamingClient", "Failed to parse SSE chunk", { error });
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function handleErrorResponse(response: Response): Promise<never> {
  let errorMessage = `HTTP ${response.status}`;
  const errorType = mapHttpStatusToErrorType(response.status);

  try {
    const errorData = (await response.json()) as { error?: { message?: string } };
    if (errorData.error?.message) errorMessage = errorData.error.message;
  } catch {
    // Use default
  }

  throw new GroqError(errorType, errorMessage);
}

function handleRequestError(error: unknown): GroqError {
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
