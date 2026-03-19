/**
 * Calculation Utilities
 * Common calculation and utility functions for numeric operations
 * Optimized for performance
 */

const MAX_RANDOM_ID_LENGTH = 11;

/**
 * Generate a random unique identifier string
 * Uses optimized single-pass operations
 */
export function generateRandomId(length: number = 9): string {
  const safeLength = Math.min(Math.max(1, Math.floor(length)), MAX_RANDOM_ID_LENGTH);
  const randomStr = Math.random().toString(36).substring(2, 2 + safeLength);
  return randomStr;
}

/**
 * Generate a unique chat session ID
 */
export function generateSessionId(prefix: string = "groq-chat"): string {
  return `${prefix}-${Date.now()}-${generateRandomId(9)}`;
}

/**
 * Calculate maximum number of messages based on token limit
 */
export function calculateMaxMessages(
  maxTokens: number,
  tokensPerMessage: number = 100
): number {
  if (!Number.isFinite(maxTokens) || maxTokens <= 0 ||
      !Number.isFinite(tokensPerMessage) || tokensPerMessage <= 0) {
    return 0;
  }
  return Math.floor(maxTokens / tokensPerMessage);
}

/**
 * Calculate exponential backoff delay
 */
export function calculateExponentialBackoff(baseDelay: number, attempt: number): number {
  if (!Number.isFinite(baseDelay) || baseDelay < 0 ||
      !Number.isFinite(attempt) || attempt < 0) {
    return 0;
  }
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (!Number.isFinite(min)) return max;
  if (!Number.isFinite(max)) return value;
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentage with optional decimal places
 * Optimized: avoids string conversion
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 2
): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total === 0) {
    return 0;
  }
  const multiplier = Math.pow(10, Math.max(0, Math.min(20, Math.floor(decimals))));
  return Math.round((value / total) * 100 * multiplier) / multiplier;
}

/**
 * Calculate buffer size limit for streaming
 */
export function calculateSafeBufferSize(currentSize: number, maxSize: number): number {
  if (!Number.isFinite(currentSize) || !Number.isFinite(maxSize) || maxSize <= 0) {
    return 0;
  }
  if (currentSize > maxSize) {
    return Math.floor(maxSize / 2);
  }
  return currentSize;
}

/**
 * Calculate token estimate from text
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Calculate if message count is within safe limits
 */
export function isWithinSafeLimit(messageCount: number, maxMessages: number): boolean {
  return Number.isFinite(messageCount) &&
         Number.isFinite(maxMessages) &&
         messageCount >= 0 &&
         messageCount <= maxMessages;
}

/**
 * Calculate retry delay with jitter
 */
export function calculateRetryDelayWithJitter(
  baseDelay: number,
  attempt: number,
  jitterFactor: number = 0.1
): number {
  if (!Number.isFinite(baseDelay) || baseDelay < 0 ||
      !Number.isFinite(attempt) || attempt < 0) {
    return 0;
  }
  const safeJitterFactor = clamp(jitterFactor, 0, 1);
  const exponentialDelay = calculateExponentialBackoff(baseDelay, attempt);
  const jitter = exponentialDelay * safeJitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, exponentialDelay + jitter);
}

/**
 * Calculate timeout for network requests
 */
export function calculateRequestTimeout(
  attempt: number,
  baseTimeout: number = 5000,
  maxTimeout: number = 30000
): number {
  if (!Number.isFinite(attempt) || attempt < 0) {
    return baseTimeout;
  }
  const safeBaseTimeout = Math.max(0, baseTimeout);
  const safeMaxTimeout = Math.max(safeBaseTimeout, maxTimeout);
  const timeout = calculateExponentialBackoff(safeBaseTimeout, attempt);
  return Math.min(timeout, safeMaxTimeout);
}

/**
 * Calculate data transfer rate
 */
export function calculateTransferRate(bytes: number, milliseconds: number): number {
  if (!Number.isFinite(bytes) || bytes < 0 ||
      !Number.isFinite(milliseconds) || milliseconds <= 0) {
    return 0;
  }
  const kilobytesPerSecond = (bytes / 1024) * (1000 / milliseconds);
  return Math.round(kilobytesPerSecond * 100) / 100;
}

/**
 * Calculate average from array of numbers
 * Optimized: Single pass with inline validation
 */
export function calculateAverage(values: number[]): number {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  let sum = 0;
  let count = 0;

  // Single pass: validate and sum
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isFinite(v)) {
      sum += v;
      count++;
    }
  }

  return count === 0 ? 0 : sum / count;
}
