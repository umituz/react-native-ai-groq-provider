/**
 * Provider Factory
 * Factory for creating configured Groq provider instances
 */

import type { GroqConfig, GroqGenerationConfig } from "../domain/entities";
import { groqHttpClient } from "../infrastructure/services/GroqClient";
import { ConfigBuilder, GenerationConfigBuilder } from "./ConfigBuilder";

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
 * Provider factory options
 */
export interface ProviderFactoryOptions {
  enableTelemetry?: boolean;
  onError?: (error: Error) => void;
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
 * Provider factory - creates configured provider instances
 */
export const providerFactory = {
  /**
   * Create a new provider instance
   */
  create(config: ProviderConfig): void {
    initializeProvider(config);
  },

  /**
   * Create provider from environment variables
   */
  fromEnv(): void {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }

    initializeProvider({
      apiKey,
      baseUrl: process.env.GROQ_BASE_URL,
      timeoutMs: process.env.GROQ_TIMEOUT_MS ? parseInt(process.env.GROQ_TIMEOUT_MS) : undefined,
    });
  },

  /**
   * Reset provider (clear configuration)
   */
  reset(): void {
    groqHttpClient.reset();
  },

  /**
   * Check if provider is initialized
   */
  isInitialized(): boolean {
    return groqHttpClient.isInitialized();
  },
};

/**
 * Convenience function to initialize provider
 */
export function configureProvider(config: ProviderConfig): void {
  providerFactory.create(config);
}

/**
 * Convenience function to reset provider
 */
export function resetProvider(): void {
  providerFactory.reset();
}

// Re-export builders
export { ConfigBuilder, GenerationConfigBuilder };
