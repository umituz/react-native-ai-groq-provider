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
  /** Request was aborted */
  ABORT_ERROR = "ABORT_ERROR",
  /** Rate limit exceeded */
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  /** Insufficient quota */
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  /** Server error */
  SERVER_ERROR = "SERVER_ERROR",
  /** Unknown error occurred */
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Map HTTP status codes to error types
 */
export function mapHttpStatusToErrorType(status: number): GroqErrorType {
  if (status === 401 || status === 403) {
    return GroqErrorType.INVALID_API_KEY;
  }
  if (status === 429) {
    return GroqErrorType.RATE_LIMIT_ERROR;
  }
  if (status >= 500 && status < 600) {
    return GroqErrorType.SERVER_ERROR;
  }
  if (status >= 400 && status < 500) {
    return GroqErrorType.INVALID_API_KEY;
  }
  return GroqErrorType.UNKNOWN_ERROR;
}
