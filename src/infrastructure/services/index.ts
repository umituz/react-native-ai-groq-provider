/**
 * Infrastructure Services
 */

export { groqHttpClient } from "./GroqClient";
export { textGeneration, chatGeneration } from "./TextGeneration";
export { structuredText, structuredChat } from "./StructuredText";
export { streaming, streamingChat, type StreamingCallbacks, type StreamingOptions } from "./Streaming";
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
} from "./ChatSession";
