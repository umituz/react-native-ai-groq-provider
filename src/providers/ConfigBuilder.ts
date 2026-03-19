/**
 * Configuration Builder
 * Builder pattern for Groq configuration
 */

import type { GroqConfig, GroqGenerationConfig } from "../domain/entities/groq.types";
import { DEFAULT_MODELS } from "../domain/entities/groq.types";

/**
 * Builder for Groq configuration
 */
export class ConfigBuilder {
  private config: Partial<GroqConfig> = {};

  withApiKey(apiKey: string): ConfigBuilder {
    this.config.apiKey = apiKey;
    return this;
  }

  withBaseUrl(baseUrl: string): ConfigBuilder {
    this.config.baseUrl = baseUrl;
    return this;
  }

  withTimeout(timeoutMs: number): ConfigBuilder {
    this.config.timeoutMs = timeoutMs;
    return this;
  }

  withTextModel(model: string): ConfigBuilder {
    this.config.textModel = model;
    return this;
  }

  build(): GroqConfig {
    if (!this.config.apiKey) {
      throw new Error("API key is required. Use withApiKey() to set it.");
    }

    return {
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
      timeoutMs: this.config.timeoutMs,
      textModel: this.config.textModel || DEFAULT_MODELS.TEXT,
    };
  }
}

/**
 * Builder for generation configuration
 */
export class GenerationConfigBuilder {
  private config: GroqGenerationConfig = {};

  withTemperature(temperature: number): GenerationConfigBuilder {
    this.config.temperature = temperature;
    return this;
  }

  withMaxTokens(maxTokens: number): GenerationConfigBuilder {
    this.config.maxTokens = maxTokens;
    return this;
  }

  withTopP(topP: number): GenerationConfigBuilder {
    this.config.topP = topP;
    return this;
  }

  withFrequencyPenalty(penalty: number): GenerationConfigBuilder {
    this.config.frequencyPenalty = penalty;
    return this;
  }

  withPresencePenalty(penalty: number): GenerationConfigBuilder {
    this.config.presencePenalty = penalty;
    return this;
  }

  withStop(stop: string[]): GenerationConfigBuilder {
    this.config.stop = stop;
    return this;
  }

  build(): GroqGenerationConfig {
    return { ...this.config };
  }
}
