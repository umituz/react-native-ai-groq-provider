/**
 * Error Mapper Utility
 * Utilities for handling and mapping errors
 */

import { GroqError, GroqErrorType } from "../../domain/entities/error.types";

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof GroqError) {
    switch (error.type) {
      case GroqErrorType.INVALID_API_KEY:
        return "Invalid API key. Please check your Groq API credentials.";
      case GroqErrorType.MISSING_CONFIG:
        return "Configuration missing. Please initialize the Groq provider.";
      case GroqErrorType.NETWORK_ERROR:
        return "Network error. Please check your internet connection.";
      case GroqErrorType.ABORT_ERROR:
        return "Request was cancelled.";
      case GroqErrorType.RATE_LIMIT_ERROR:
        return "Rate limit exceeded. Please wait a moment and try again.";
      case GroqErrorType.QUOTA_EXCEEDED:
        return "API quota exceeded. Please check your Groq account.";
      case GroqErrorType.SERVER_ERROR:
        return "Groq server error. Please try again later.";
      default:
        return error.message || "An unknown error occurred.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred.";
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof GroqError) {
    return (
      error.type === GroqErrorType.RATE_LIMIT_ERROR ||
      error.type === GroqErrorType.SERVER_ERROR ||
      error.type === GroqErrorType.NETWORK_ERROR
    );
  }
  return false;
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof GroqError) {
    return error.type === GroqErrorType.INVALID_API_KEY;
  }
  return false;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): string {
  if (error instanceof GroqError) {
    return `[GroqError:${error.type}] ${error.message}`;
  }

  if (error instanceof Error) {
    return `[${error.name}] ${error.message}`;
  }

  return String(error);
}
