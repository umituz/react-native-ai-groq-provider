/**
 * @umituz/react-native-ai-groq-provider
 * Groq text generation provider for React Native applications
 *
 * @author umituz
 * @license MIT
 */

// Domain Layer - Direct exports, no barrel re-exports
export type {
  GroqConfig,
  GroqGenerationConfig,
  GroqMessageRole,
  GroqMessage,
  GroqChatRequest,
  GroqChatResponse,
  GroqChoice,
  GroqFinishReason,
  GroqUsage,
  GroqChatChunk,
  GroqChunkChoice,
  GroqErrorResponse,
  GroqChatConfig,
} from "./domain/entities/groq.types";

export { GROQ_MODELS, DEFAULT_MODELS } from "./domain/entities/groq.types";

export {
  GroqError,
  GroqErrorType,
  mapHttpStatusToErrorType,
} from "./domain/entities/error.types";

export {
  MODEL_REGISTRY,
  getModelInfo,
  modelSupports,
  type ModelCapabilities,
  type ModelInfo,
} from "./domain/entities/models";

// Application Layer - Direct exports
export { generateText, type TextGenerationOptions } from "./application/use-cases/text-generation.usecase";
export { generateStructured, type StructuredGenerationOptions } from "./application/use-cases/structured-generation.usecase";
export { streamText, type StreamingCallbacks, type StreamingOptions } from "./application/use-cases/streaming.usecase";
export { chatSessionManager, type ChatSession, type ChatSendResult } from "./application/use-cases/chat-session.usecase";

// Infrastructure Layer - Direct exports
export { groqHttpClient } from "./infrastructure/http/groq-http-client";
export { streamChatCompletion } from "./infrastructure/http/streaming-client";

// Presentation Layer - Direct exports
export { useGroq, type UseGroqOptions, type UseGroqReturn } from "./presentation/hooks/use-groq.hook";

// Shared Layer - Direct exports
export { logger, LogLevel, type LogContext } from "./shared/logger";
export { Timer, type TimerResult } from "./shared/timer";
export { RequestBuilder, type RequestBuilderOptions } from "./shared/request-builder";
export { ResponseHandler, type ResponseHandlerResult } from "./shared/response-handler";

// Provider Factory - Direct exports, no wrappers
export { ConfigBuilder, GenerationConfigBuilder } from "./providers/ConfigBuilder";
export { initializeProvider, resetProvider, isProviderInitialized, type ProviderConfig } from "./providers/ProviderFactory";

// Utilities - Direct exports, no barrel re-exports
export {
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
  createTextMessage,
  promptToMessages,
  extractTextFromMessages,
  formatMessagesForDisplay,
  cleanJsonResponse,
} from "./infrastructure/utils/content-mapper.util";

export {
  getUserFriendlyError,
  isRetryableError,
  isAuthError,
  formatErrorForLogging,
} from "./infrastructure/utils/error-mapper.util";

export {
  executeWithState,
  executeWithRetry,
  type AsyncStateSetters,
  type AsyncCallbacks,
} from "./infrastructure/utils/async/execute-state.util";

export {
  generateRandomId,
  generateSessionId,
  calculateMaxMessages,
  calculateExponentialBackoff,
  clamp,
  calculatePercentage,
  calculateSafeBufferSize,
  estimateTokens,
  isWithinSafeLimit,
  calculateRetryDelayWithJitter,
  calculateRequestTimeout,
  calculateTransferRate,
  calculateAverage,
} from "./infrastructure/utils/calculation.util";

export { telemetry, useTelemetry } from "./infrastructure/telemetry/TelemetryHooks";
