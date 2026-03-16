/**
 * Chat Session Service
 * Manages multi-turn chat conversations with Groq API
 */

import type {
  GroqMessage,
  GroqChatConfig,
  GroqGenerationConfig,
} from "../../domain/entities";
import { groqHttpClient } from "./GroqClient";
import { DEFAULT_MODELS } from "../../domain/entities";
import { GroqError, GroqErrorType } from "../../domain/entities/error.types";
import { generateSessionId, calculateMaxMessages } from "../../infrastructure/utils/calculation.util";

/**
 * Chat session state
 */
export interface ChatSession {
  id: string;
  model: string;
  systemInstruction?: string;
  messages: GroqMessage[];
  generationConfig?: GroqGenerationConfig;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of sending a chat message
 */
export interface ChatSendResult {
  response: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

/**
 * Options for sending a chat message
 */
export interface SendChatMessageOptions {
  /** Stream the response (not yet implemented) */
  stream?: boolean;
}

/**
 * Message format for chat history (simplified)
 */
export type ChatHistoryMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Create a new chat session
 */
export function createChatSession(config: GroqChatConfig = {}): ChatSession {
  return {
    id: generateSessionId("groq-chat"),
    model: config.model || DEFAULT_MODELS.TEXT,
    systemInstruction: config.systemInstruction,
    messages: config.history ? [...config.history] : [],
    generationConfig: config.generationConfig,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Chat session service
 */
class ChatSessionService {
  private sessions = new Map<string, ChatSession>();
  private readonly MAX_SESSIONS = 100; // Prevent unlimited memory growth
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Create a new chat session
   */
  create(config: GroqChatConfig = {}): ChatSession {
    // Auto-cleanup old sessions before creating new one
    this.cleanupOldSessions();

    const session = createChatSession(config);
    this.sessions.set(session.id, session);

    // Enforce session limit
    if (this.sessions.size > this.MAX_SESSIONS) {
      // Remove oldest sessions
      const sortedSessions = Array.from(this.sessions.entries())
        .sort(([, a], [, b]) => a.createdAt.getTime() - b.createdAt.getTime());

      const toRemove = sortedSessions.slice(0, this.sessions.size - this.MAX_SESSIONS);
      for (const [id] of toRemove) {
        this.sessions.delete(id);
      }
    }

    return session;
  }

  /**
   * Get a session by ID
   */
  get(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Delete a session
   */
  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Cleanup old sessions automatically
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, session] of this.sessions.entries()) {
      const age = now - session.updatedAt.getTime();
      if (age > this.SESSION_TTL_MS) {
        expiredIds.push(id);
      }
    }

    for (const id of expiredIds) {
      this.sessions.delete(id);
    }
  }

  /**
   * Get active session count
   */
  getActiveCount(): number {
    return this.sessions.size;
  }

  /**
   * Clear all sessions
   */
  clearAll(): void {
    this.sessions.clear();
  }

  /**
   * Send a message in a chat session
   */
  async send(
    sessionId: string,
    content: string,
    _options: SendChatMessageOptions = {}
  ): Promise<ChatSendResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        `Chat session ${sessionId} not found`
      );
    }

    // Add user message to history
    const userMessage: GroqMessage = {
      role: "user",
      content,
    };
    session.messages.push(userMessage);

    // Build messages array for API
    const messagesForApi = buildChatHistory(session);

    // Call API
    const response = await groqHttpClient.chatCompletion({
      model: session.model,
      messages: messagesForApi,
      temperature: session.generationConfig?.temperature || 0.7,
      max_tokens: session.generationConfig?.maxTokens || 1024,
      top_p: session.generationConfig?.topP,
    });

    // Extract assistant response
    const assistantContent = response.choices[0]?.message?.content;
    if (!assistantContent) {
      throw new GroqError(
        GroqErrorType.UNKNOWN_ERROR,
        "No content generated from Groq API"
      );
    }

    // Add assistant message to history
    const assistantMessage: GroqMessage = {
      role: "assistant",
      content: assistantContent,
    };
    session.messages.push(assistantMessage);

    // Update timestamp
    session.updatedAt = new Date();

    return {
      response: assistantContent,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: response.choices[0]?.finish_reason || "unknown",
    };
  }

  /**
   * Reset a chat session (clear messages except system instruction)
   */
  reset(sessionId: string): ChatSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        `Chat session ${sessionId} not found`
      );
    }

    session.messages = [];
    session.updatedAt = new Date();

    return session;
  }

  /**
   * Update a chat session's config
   */
  updateConfig(sessionId: string, config: Partial<GroqChatConfig>): ChatSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        `Chat session ${sessionId} not found`
      );
    }

    if (config.model !== undefined) session.model = config.model;
    if (config.systemInstruction !== undefined) session.systemInstruction = config.systemInstruction;
    if (config.generationConfig !== undefined) session.generationConfig = config.generationConfig;
    if (config.history) session.messages = [...config.history];

    session.updatedAt = new Date();

    return session;
  }
}

/**
 * Singleton instance
 */
export const chatSessionService = new ChatSessionService();

/**
 * Convenience function to send a chat message
 */
export async function sendChatMessage(
  sessionId: string,
  content: string,
  options?: SendChatMessageOptions
): Promise<ChatSendResult> {
  return chatSessionService.send(sessionId, content, options);
}

/**
 * Build chat history for API request
 */
export function buildChatHistory(session: ChatSession): GroqMessage[] {
  const messages: GroqMessage[] = [];

  // Add system instruction if present
  if (session.systemInstruction) {
    messages.push({
      role: "system",
      content: session.systemInstruction,
    });
  }

  // Add conversation history
  messages.push(...session.messages);

  return messages;
}

/**
 * Trim chat history to fit within token limit
 */
export function trimChatHistory(
  messages: GroqMessage[],
  maxTokens: number = 4000
): GroqMessage[] {
  // Calculate max messages using utility function
  const maxMessages = calculateMaxMessages(maxTokens);

  if (messages.length <= maxMessages) {
    return messages;
  }

  // Keep system messages and trim from oldest to newest
  const systemMessages = messages.filter((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  const trimmed = nonSystemMessages.slice(-maxMessages);

  return [...systemMessages, ...trimmed];
}
