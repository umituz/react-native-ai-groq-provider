/**
 * Custom error class for Groq operations
 */
export class GroqError extends Error {
  constructor(
    public type: GroqErrorType,
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "GroqError";
  }
}

/**
 * Error types for Groq operations
 */
export enum GroqErrorType {
  /** API key is missing or invalid */
  INVALID_API_KEY = "INVALID_API_KEY",
  /** Configuration is missing or invalid */
  MISSING_CONFIG = "MISSING_CONFIG",
  /** Network error occurred */
  NETWORK_ERROR = "NETWORK_ERROR",
  /** Request was aborted or timed out */
  ABORT_ERROR = "ABORT_ERROR",
  /** Rate limit exceeded */
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  /** Insufficient quota */
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  /** Server error */
  SERVER_ERROR = "SERVER_ERROR",
  /** Client error (invalid request) */
  CLIENT_ERROR = "CLIENT_ERROR",
  /** Unknown error occurred */
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Map HTTP status codes to error types
 */
export function mapHttpStatusToErrorType(status: number): GroqErrorType {
  // Authentication errors
  if (status === 401 || status === 403) {
    return GroqErrorType.INVALID_API_KEY;
  }

  // Rate limiting
  if (status === 429) {
    return GroqErrorType.RATE_LIMIT_ERROR;
  }

  // Quota exceeded
  if (status === 402) {
    return GroqErrorType.QUOTA_EXCEEDED;
  }

  // Server errors
  if (status >= 500 && status < 600) {
    return GroqErrorType.SERVER_ERROR;
  }

  // Client errors (4xx except specific cases above)
  if (status >= 400 && status < 500) {
    return GroqErrorType.CLIENT_ERROR;
  }

  return GroqErrorType.UNKNOWN_ERROR;
}
