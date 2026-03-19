/**
 * Provider Factory
 * Factory for creating configured Groq provider instances
 */

import { groqHttpClient } from "../infrastructure/http/groq-http-client";

/**
 * Provider configuration options
 */
export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  defaultModel?: string;
}

/**
 * Initialize Groq provider with configuration
 */
export function initializeProvider(config: ProviderConfig): void {
  groqHttpClient.initialize({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    timeoutMs: config.timeoutMs,
    textModel: config.defaultModel,
  });
}

/**
 * Reset provider configuration
 */
export function resetProvider(): void {
  groqHttpClient.reset();
}

/**
 * Check if provider is initialized
 */
export function isProviderInitialized(): boolean {
  return groqHttpClient.isInitialized();
}
