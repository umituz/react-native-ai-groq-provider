/**
 * @umituz/react-native-ai-groq-provider
 * Groq text generation provider for React Native applications
 *
 * @author umituz
 * @license MIT
 */

// Domain Types
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

// Services
export { groqHttpClient } from "./infrastructure/services/GroqClient";
export { textGeneration, chatGeneration } from "./infrastructure/services/TextGeneration";
export { structuredText, structuredChat } from "./infrastructure/services/StructuredText";
export { streaming, streamingChat } from "./infrastructure/services/Streaming";
export {
  chatSessionService,
  createChatSession,
  sendChatMessage,
  buildChatHistory,
  trimChatHistory,
  type ChatSession,
  type SendChatMessageOptions,
  type ChatSendResult,
  type ChatHistoryMessage,
} from "./infrastructure/services";

export type { StreamingCallbacks, StreamingOptions } from "./infrastructure/services/Streaming";

// React Hooks
export { useGroq } from "./presentation/hooks/useGroq";
export type { UseGroqOptions, UseGroqReturn } from "./presentation/hooks/useGroq";

export { useOperationManager } from "./presentation/hooks/useOperationManager";

// Provider Configuration & Factory
export {
  ConfigBuilder,
  GenerationConfigBuilder,
  providerFactory,
  initializeProvider,
  configureProvider,
  resetProvider,
} from "./providers/ProviderFactory";

export type {
  ProviderConfig,
  ProviderFactoryOptions,
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
  telemetry,
  useTelemetry,
} from "./infrastructure/telemetry";
