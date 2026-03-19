/**
 * Request Builder Utility
 * Centralized request building logic
 */

import type {
  GroqChatRequest,
  GroqGenerationConfig,
  GroqMessage,
} from "../domain/entities/groq.types";
import { DEFAULT_MODELS } from "../domain/entities/groq.types";

export interface RequestBuilderOptions {
  model?: string;
  generationConfig?: GroqGenerationConfig;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}

export class RequestBuilder {
  static buildChatRequest(
    messages: GroqMessage[],
    options: RequestBuilderOptions = {}
  ): GroqChatRequest {
    const {
      model = DEFAULT_MODELS.TEXT,
      generationConfig = {},
      defaultTemperature = 0.7,
      defaultMaxTokens = 1024,
    } = options;

    return {
      model,
      messages,
      temperature: generationConfig.temperature !== undefined
        ? generationConfig.temperature
        : defaultTemperature,
      max_tokens: generationConfig.maxTokens !== undefined
        ? generationConfig.maxTokens
        : defaultMaxTokens,
      top_p: generationConfig.topP,
      n: generationConfig.n,
      stop: generationConfig.stop,
      frequency_penalty: generationConfig.frequencyPenalty,
      presence_penalty: generationConfig.presencePenalty,
    };
  }

  static buildPromptRequest(
    prompt: string,
    options: RequestBuilderOptions = {}
  ): GroqChatRequest {
    const messages: GroqMessage[] = [{ role: "user", content: prompt }];
    return this.buildChatRequest(messages, options);
  }

  static buildSystemPromptRequest(
    systemPrompt: string,
    userPrompt: string,
    options: RequestBuilderOptions = {}
  ): GroqChatRequest {
    const messages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    return this.buildChatRequest(messages, options);
  }
}
