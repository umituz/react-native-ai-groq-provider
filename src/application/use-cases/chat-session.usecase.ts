/**
 * Chat Session Use Case
 * Manages multi-turn chat conversations
 */

import type { GroqMessage, GroqChatConfig } from "../../domain/entities/groq.types";
import { DEFAULT_MODELS } from "../../domain/entities/groq.types";
import { groqHttpClient } from "../../infrastructure/http/groq-http-client";
import { RequestBuilder } from "../../shared/request-builder";
import { ResponseHandler } from "../../shared/response-handler";
import { logger } from "../../shared/logger";
import { GroqError, GroqErrorType } from "../../domain/entities/error.types";
import { generateSessionId } from "../../infrastructure/utils/calculation.util";

export interface ChatSession {
  id: string;
  model: string;
  systemInstruction?: string;
  messages: GroqMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSendResult {
  response: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

class ChatSessionManager {
  private sessions = new Map<string, ChatSession>();
  private readonly MAX_SESSIONS = 100;
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000;
  private oldestSessionId: string | null = null;
  private cleanupScheduled = false;
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  create(config: GroqChatConfig = {}): ChatSession {
    // Lazy cleanup - only check when needed, not every time
    if (this.sessions.size >= this.MAX_SESSIONS || !this.cleanupScheduled) {
      this.scheduleCleanup();
    }

    const session: ChatSession = {
      id: generateSessionId("groq-chat"),
      model: config.model || DEFAULT_MODELS.TEXT,
      systemInstruction: config.systemInstruction,
      messages: config.history ? [...config.history] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(session.id, session);

    // Track oldest session for O(1) removal
    if (!this.oldestSessionId ||
        this.sessions.get(this.oldestSessionId)!.createdAt > session.createdAt) {
      this.oldestSessionId = session.id;
    }

    // Fast path: if at limit, just remove oldest
    if (this.sessions.size > this.MAX_SESSIONS && this.oldestSessionId) {
      this.sessions.delete(this.oldestSessionId);
      this.updateOldestSessionId();
    }

    return session;
  }

  get(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  delete(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted && sessionId === this.oldestSessionId) {
      this.updateOldestSessionId();
    }
    return deleted;
  }

  private scheduleCleanup(): void {
    if (this.cleanupScheduled) return;

    this.cleanupScheduled = true;
    // Schedule cleanup for next idle time
    setTimeout(() => {
      this.cleanupOldSessions();
      this.cleanupScheduled = false;
    }, this.CLEANUP_INTERVAL_MS);
  }

  private updateOldestSessionId(): void {
    let oldest: Date | null = null;
    let oldestId: string | null = null;

    for (const [id, session] of this.sessions.entries()) {
      if (!oldest || session.createdAt < oldest) {
        oldest = session.createdAt;
        oldestId = id;
      }
    }

    this.oldestSessionId = oldestId;
  }

  private cleanupOldSessions(): void {
    const now = Date.now();
    let removed = 0;

    for (const [id, session] of this.sessions.entries()) {
      const age = now - session.updatedAt.getTime();
      if (age > this.SESSION_TTL_MS) {
        this.sessions.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.updateOldestSessionId();
    }
  }

  async send(sessionId: string, content: string): Promise<ChatSendResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        `Chat session ${sessionId} not found`
      );
    }

    const userMessage: GroqMessage = { role: "user", content };
    session.messages.push(userMessage);

    // Prevent unbounded memory growth
    if (session.messages.length > 100) {
      session.messages = session.messages.slice(-50); // Keep last 50
    }

    const messages = this.buildMessages(session);
    const request = RequestBuilder.buildChatRequest(messages, {
      model: session.model,
    });

    logger.debug("ChatSession", "Sending message", {
      sessionId,
      messageCount: session.messages.length,
    });

    const response = await groqHttpClient.chatCompletion(request);
    const handled = ResponseHandler.handleResponse(response);

    const assistantMessage: GroqMessage = {
      role: "assistant",
      content: handled.content,
    };
    session.messages.push(assistantMessage);
    session.updatedAt = new Date();

    return {
      response: handled.content,
      usage: handled.usage,
      finishReason: handled.finishReason,
    };
  }

  private buildMessages(session: ChatSession): GroqMessage[] {
    const messages: GroqMessage[] = [];

    if (session.systemInstruction) {
      messages.push({ role: "system", content: session.systemInstruction });
    }

    messages.push(...session.messages);

    return messages;
  }
}

export const chatSessionManager = new ChatSessionManager();
