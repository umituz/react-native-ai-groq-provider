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

  create(config: GroqChatConfig = {}): ChatSession {
    this.cleanupOldSessions();

    const session: ChatSession = {
      id: generateSessionId("groq-chat"),
      model: config.model || DEFAULT_MODELS.TEXT,
      systemInstruction: config.systemInstruction,
      messages: config.history ? [...config.history] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(session.id, session);

    if (this.sessions.size > this.MAX_SESSIONS) {
      this.removeOldestSessions();
    }

    return session;
  }

  get(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  private cleanupOldSessions(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, session] of this.sessions.entries()) {
      const age = now - session.updatedAt.getTime();
      if (age > this.SESSION_TTL_MS) {
        expiredIds.push(id);
      }
    }

    expiredIds.forEach((id) => this.sessions.delete(id));
  }

  private removeOldestSessions(): void {
    const excessCount = this.sessions.size - this.MAX_SESSIONS;
    if (excessCount <= 0) return;

    // Sort by creation date and remove oldest
    const sorted = Array.from(this.sessions.entries())
      .sort(([, a], [, b]) => a.createdAt.getTime() - b.createdAt.getTime());

    for (let i = 0; i < excessCount; i++) {
      this.sessions.delete(sorted[i][0]);
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
