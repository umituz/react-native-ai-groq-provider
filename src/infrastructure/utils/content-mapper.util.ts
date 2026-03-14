/**
 * Content Mapper Utility
 * Utilities for working with message content
 */

import type { GroqMessage } from "../../domain/entities";

/**
 * Create a user message
 */
export function createUserMessage(content: string): GroqMessage {
  return {
    role: "user",
    content,
  };
}

/**
 * Create an assistant message
 */
export function createAssistantMessage(content: string): GroqMessage {
  return {
    role: "assistant",
    content,
  };
}

/**
 * Create a system message
 */
export function createSystemMessage(content: string): GroqMessage {
  return {
    role: "system",
    content,
  };
}

/**
 * Create a text message (defaults to user role)
 */
export function createTextMessage(content: string, role: "user" | "assistant" | "system" = "user"): GroqMessage {
  return {
    role,
    content,
  };
}

/**
 * Convert a simple prompt string to an array of messages
 */
export function promptToMessages(prompt: string, systemPrompt?: string): GroqMessage[] {
  const messages: GroqMessage[] = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  return messages;
}

/**
 * Extract text content from an array of messages
 */
export function extractTextFromMessages(messages: GroqMessage[]): string {
  return messages.map((m) => `[${m.role}]: ${m.content}`).join("\n\n");
}

/**
 * Format messages for display in UI
 */
export function formatMessagesForDisplay(messages: GroqMessage[]): string {
  return messages
    .map((m) => {
      const role = m.role === "system" ? "System" : m.role === "user" ? "You" : "Assistant";
      return `${role}:\n${m.content}`;
    })
    .join("\n\n---\n\n");
}
