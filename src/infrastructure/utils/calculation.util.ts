/**
 * Calculation Utilities
 * Common calculation and utility functions for numeric operations
 */

/**
 * Generate a random unique identifier string
 * @param length - Length of the random string (default: 9)
 * @returns Random string in base-36
 */
export function generateRandomId(length: number = 9): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Generate a unique chat session ID
 * @param prefix - Optional prefix for the ID (default: "groq-chat")
 * @returns Unique session identifier
 */
export function generateSessionId(prefix: string = "groq-chat"): string {
  return `${prefix}-${Date.now()}-${generateRandomId(9)}`;
}

/**
 * Calculate maximum number of messages based on token limit
 * Uses a heuristic of approximately 100 tokens per message
 * @param maxTokens - Maximum allowed tokens
 * @param tokensPerMessage - Estimated tokens per message (default: 100)
 * @returns Maximum number of messages
 */
export function calculateMaxMessages(
  maxTokens: number,
  tokensPerMessage: number = 100
): number {
  if (maxTokens <= 0) {
    return 0;
  }
  return Math.floor(maxTokens / tokensPerMessage);
}

/**
 * Calculate exponential backoff delay
 * @param baseDelay - Initial delay in milliseconds
 * @param attempt - Current attempt number (0-indexed)
 * @returns Delay in milliseconds
 */
export function calculateExponentialBackoff(baseDelay: number, attempt: number): number {
  if (baseDelay < 0 || attempt < 0) {
    return 0;
  }
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentage with optional decimal places
 * @param value - Current value
 * @param total - Total value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Percentage value
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 2
): number {
  if (total === 0) {
    return 0;
  }
  return Number(((value / total) * 100).toFixed(decimals));
}

/**
 * Calculate buffer size limit for streaming
 * Ensures buffer doesn't grow beyond reasonable limits
 * @param currentSize - Current buffer size
 * @param maxSize - Maximum allowed buffer size
 * @returns Safe buffer size
 */
export function calculateSafeBufferSize(currentSize: number, maxSize: number): number {
  if (currentSize > maxSize) {
    return Math.floor(maxSize / 2);
  }
  return currentSize;
}

/**
 * Calculate token estimate from text
 * Rough approximation: ~4 characters per token
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  if (!text) {
    return 0;
  }
  return Math.ceil(text.length / 4);
}

/**
 * Calculate if message count is within safe limits
 * @param messageCount - Current message count
 * @param maxMessages - Maximum allowed messages
 * @returns Whether within safe limits
 */
export function isWithinSafeLimit(messageCount: number, maxMessages: number): boolean {
  return messageCount >= 0 && messageCount <= maxMessages;
}

/**
 * Calculate retry delay with jitter
 * Adds random jitter to prevent thundering herd
 * @param baseDelay - Base delay in milliseconds
 * @param attempt - Current attempt number
 * @param jitterFactor - Jitter factor (0-1, default: 0.1)
 * @returns Delay with jitter applied
 */
export function calculateRetryDelayWithJitter(
  baseDelay: number,
  attempt: number,
  jitterFactor: number = 0.1
): number {
  const exponentialDelay = calculateExponentialBackoff(baseDelay, attempt);
  const jitter = exponentialDelay * jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, exponentialDelay + jitter);
}

/**
 * Calculate timeout for network requests
 * Based on exponential backoff with a maximum cap
 * @param attempt - Current attempt number
 * @param baseTimeout - Base timeout in milliseconds (default: 5000)
 * @param maxTimeout - Maximum timeout in milliseconds (default: 30000)
 * @returns Timeout in milliseconds
 */
export function calculateRequestTimeout(
  attempt: number,
  baseTimeout: number = 5000,
  maxTimeout: number = 30000
): number {
  const timeout = calculateExponentialBackoff(baseTimeout, attempt);
  return Math.min(timeout, maxTimeout);
}

/**
 * Calculate data transfer rate
 * @param bytes - Number of bytes transferred
 * @param milliseconds - Time taken in milliseconds
 * @returns Transfer rate in KB/s
 */
export function calculateTransferRate(bytes: number, milliseconds: number): number {
  if (milliseconds === 0) {
    return 0;
  }
  const seconds = milliseconds / 1000;
  const kilobytes = bytes / 1024;
  return Number((kilobytes / seconds).toFixed(2));
}

/**
 * Calculate average from array of numbers
 * @param values - Array of numbers
 * @returns Average value or 0 if array is empty
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}
