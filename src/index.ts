/**
 * @umituz/react-native-ai-groq-provider
 * Groq text generation provider for React Native applications
 *
 * DDD Architecture:
 * - Domain: Core entities and types
 * - Application: Use cases and business logic
 * - Infrastructure: External services and HTTP clients
 * - Presentation: React hooks and UI utilities
 * - Shared: Common utilities
 *
 * @author umituz
 * @license MIT
 */

// Domain Layer
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
} from "./domain/entities";

export {
  GROQ_MODELS,
  DEFAULT_MODELS,
} from "./domain/entities";

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

// Application Layer (Use Cases)
export {
  generateText,
  generateStructured,
  streamText,
  chatSessionManager,
  type TextGenerationOptions,
  type StructuredGenerationOptions,
  type StreamingCallbacks,
  type StreamingOptions,
  type ChatSession,
  type ChatSendResult,
} from "./application/use-cases";

// Infrastructure Layer
export {
  groqHttpClient,
  streamChatCompletion,
} from "./infrastructure/http";

// Presentation Layer
export {
  useGroq,
  type UseGroqOptions,
  type UseGroqReturn,
} from "./presentation";

// Shared Layer
export {
  logger,
  LogLevel,
  Timer,
  RequestBuilder,
  ResponseHandler,
  type LogContext,
  type TimerResult,
  type RequestBuilderOptions,
  type ResponseHandlerResult,
} from "./shared";

// Provider Factory
export {
  ConfigBuilder,
  GenerationConfigBuilder,
  providerFactory,
  initializeProvider,
  configureProvider,
  resetProvider,
  type ProviderConfig,
  type ProviderFactoryOptions,
} from "./providers/ProviderFactory";

// Utilities
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
} from "./infrastructure/utils/async";

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

export {
  telemetry,
  useTelemetry,
} from "./infrastructure/telemetry";
