/**
 * Configuration for Groq client initialization
 */
export interface GroqConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL for API requests (default: https://api.groq.com/openai/v1) */
  baseUrl?: string;
  /** Default timeout in milliseconds */
  timeoutMs?: number;
  /** Default model to use for text generation */
  textModel?: string;
}

/**
 * Generation configuration for AI requests
 */
export interface GroqGenerationConfig {
  /** Controls randomness (0.0 - 2.0, default: 0.7) */
  temperature?: number;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Nucleus sampling threshold (0.0 - 1.0) */
  topP?: number;
  /** Number of completions to generate */
  n?: number;
  /** Stop sequences */
  stop?: string[];
  /** Frequency penalty (-2.0 to 2.0) */
  frequencyPenalty?: number;
  /** Presence penalty (-2.0 to 2.0) */
  presencePenalty?: number;
}

/**
 * Message role in chat conversation
 */
export type GroqMessageRole = "system" | "user" | "assistant";

/**
 * Chat message structure
 */
export interface GroqMessage {
  /** Role of the message sender */
  role: GroqMessageRole;
  /** Content of the message */
  content: string;
}

/**
 * Chat completion request
 */
export interface GroqChatRequest {
  /** Model to use for generation */
  model: string;
  /** Array of messages in the conversation */
  messages: GroqMessage[];
  /** Generation configuration */
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  n?: number;
  stop?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  /** Enable streaming response */
  stream?: boolean;
}

/**
 * Chat completion response
 */
export interface GroqChatResponse {
  /** Unique identifier for the response */
  id: string;
  /** Object type (chat.completion) */
  object: string;
  /** Timestamp of creation */
  created: number;
  /** Model used for generation */
  model: string;
  /** Array of completion choices */
  choices: GroqChoice[];
  /** Token usage information */
  usage: GroqUsage;
  /** System fingerprint (Groq specific) */
  system_fingerprint?: string;
  /** X Groq (Groq specific) */
  x_groq?: {
    id?: string;
  };
}

/**
 * Individual completion choice
 */
export interface GroqChoice {
  /** Index of the choice */
  index: number;
  /** Generated message */
  message: {
    role: "assistant";
    content: string;
  };
  /** Reason for finish (stop, length, etc.) */
  finish_reason: GroqFinishReason;
  /** Logprobs (optional) */
  logprobs: null | object;
}

/**
 * Finish reason types
 */
export type GroqFinishReason = "stop" | "length" | "content_filter";

/**
 * Token usage information
 */
export interface GroqUsage {
  /** Number of tokens in the prompt */
  prompt_tokens: number;
  /** Number of tokens in the completion */
  completion_tokens: number;
  /** Total number of tokens used */
  total_tokens: number;
  /** Prompt time (Groq specific) */
  prompt_time?: number;
  /** Completion time (Groq specific) */
  completion_time?: number;
  /** Total time (Groq specific) */
  total_time?: number;
}

/**
 * Streaming chunk response
 */
export interface GroqChatChunk {
  /** Unique identifier for the response */
  id: string;
  /** Object type (chat.completion.chunk) */
  object: string;
  /** Timestamp of creation */
  created: number;
  /** Model used for generation */
  model: string;
  /** Array of completion choices */
  choices: GroqChunkChoice[];
  /** System fingerprint (Groq specific) */
  system_fingerprint?: string;
  /** X Groq (Groq specific) */
  x_groq?: {
    id?: string;
  };
}

/**
 * Individual chunk choice for streaming
 */
export interface GroqChunkChoice {
  /** Index of the choice */
  index: number;
  /** Delta message (partial content) */
  delta: {
    role?: "assistant";
    content?: string;
  };
  /** Reason for finish (null if not finished) */
  finish_reason: GroqFinishReason | null;
  /** Logprobs (optional) */
  logprobs: null | object;
}

/**
 * API error response
 */
export interface GroqErrorResponse {
  /** Error type */
  error: {
    /** Error message */
    message: string;
    /** Error type */
    type: string;
    /** Error code */
    code?: string;
  };
}

/**
 * Configuration for a chat session
 */
export interface GroqChatConfig {
  /** Model name override */
  model?: string;
  /** System instruction for the model */
  systemInstruction?: string;
  /** Generation config (temperature, maxTokens, etc.) */
  generationConfig?: GroqGenerationConfig;
  /** Initial conversation history */
  history?: GroqMessage[];
}

/**
 * Available Groq models
 */
export const GROQ_MODELS = {
  /** Llama 3.1 8B - Fast and efficient (560 T/s) */
  LLAMA_3_1_8B_INSTANT: "llama-3.1-8b-instant",
  /** Llama 3.3 70B - Versatile and powerful (280 T/s) */
  LLAMA_3_3_70B_VERSATILE: "llama-3.3-70b-versatile",
  /** Llama 3.1 70B - Versatile (280 T/s) */
  LLAMA_3_1_70B_VERSATILE: "llama-3.1-70b-versatile",
  /** GPT-OSS 20B - Experimental (1000 T/s) */
  GPT_OSS_20B: "openai/gpt-oss-20b",
  /** GPT-OSS 120B - Large experimental model */
  GPT_OSS_120B: "openai/gpt-oss-120b",
  /** Mixtral 8x7b - MoE model */
  MIXTRAL_8X7B: "mixtral-8x7b-32768",
  /** Gemma 2 9B - Google's model */
  GEMMA_2_9B: "gemma2-9b-it",
  /** Llama 4 Scout 17B - New model (30K T/s) */
  LLAMA_4_SCOUT_17B: "meta-llama/llama-4-scout-17b-16e-instruct",
  /** Kimi K2 - Moonshot AI model */
  KIMI_K2_INSTRUCT: "moonshotai/kimi-k2-instruct",
  /** Qwen 3 32B - Alibaba's model */
  QWEN3_32B: "qwen/qwen3-32b",
} as const;

/**
 * Default models for different use cases
 */
export const DEFAULT_MODELS = {
  TEXT: GROQ_MODELS.LLAMA_3_1_8B_INSTANT,
  FAST: GROQ_MODELS.LLAMA_3_1_8B_INSTANT,
  EXPERIMENTAL: GROQ_MODELS.GPT_OSS_20B,
} as const;
