/**
 * Model Types and Configurations
 */

import { GROQ_MODELS } from "./groq.types";

/**
 * Model capabilities
 */
export interface ModelCapabilities {
  /** Supports streaming */
  streaming: boolean;
  /** Supports function calling */
  functionCalling: boolean;
  /** Supports vision */
  vision: boolean;
  /** Maximum context length */
  maxContextLength: number;
  /** Supports system instructions */
  systemInstructions: boolean;
}

/**
 * Model information
 */
export interface ModelInfo {
  /** Model ID */
  id: string;
  /** Display name */
  name: string;
  /** Model capabilities */
  capabilities: ModelCapabilities;
  /** Recommended temperature range */
  temperatureRange: [number, number];
  /** Speed in tokens/second */
  speed?: number;
  /** Cost per 1M tokens (input) */
  costPerInput?: number;
  /** Cost per 1M tokens (output) */
  costPerOutput?: number;
}

/**
 * Model registry with capabilities
 */
export const MODEL_REGISTRY: Record<string, ModelInfo> = {
  [GROQ_MODELS.LLAMA_3_1_8B_INSTANT]: {
    id: GROQ_MODELS.LLAMA_3_1_8B_INSTANT,
    name: "Llama 3.1 8B Instant",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      maxContextLength: 131072,
      systemInstructions: true,
    },
    temperatureRange: [0.0, 2.0],
    speed: 560,
    costPerInput: 0.05,
    costPerOutput: 0.08,
  },
  [GROQ_MODELS.LLAMA_3_3_70B_VERSATILE]: {
    id: GROQ_MODELS.LLAMA_3_3_70B_VERSATILE,
    name: "Llama 3.3 70B Versatile",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      maxContextLength: 131072,
      systemInstructions: true,
    },
    temperatureRange: [0.0, 2.0],
    speed: 280,
    costPerInput: 0.59,
    costPerOutput: 0.79,
  },
  [GROQ_MODELS.LLAMA_3_1_70B_VERSATILE]: {
    id: GROQ_MODELS.LLAMA_3_1_70B_VERSATILE,
    name: "Llama 3.1 70B Versatile",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      maxContextLength: 131072,
      systemInstructions: true,
    },
    temperatureRange: [0.0, 2.0],
    speed: 280,
    costPerInput: 0.59,
    costPerOutput: 0.79,
  },
  [GROQ_MODELS.GPT_OSS_20B]: {
    id: GROQ_MODELS.GPT_OSS_20B,
    name: "GPT-OSS 20B",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      maxContextLength: 131072,
      systemInstructions: true,
    },
    temperatureRange: [0.0, 2.0],
    speed: 1000,
    costPerInput: 0.075,
    costPerOutput: 0.30,
  },
  [GROQ_MODELS.GPT_OSS_120B]: {
    id: GROQ_MODELS.GPT_OSS_120B,
    name: "GPT-OSS 120B",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      maxContextLength: 131072,
      systemInstructions: true,
    },
    temperatureRange: [0.0, 2.0],
    speed: 400,
    costPerInput: 0.40,
    costPerOutput: 0.40,
  },
  [GROQ_MODELS.MIXTRAL_8X7B]: {
    id: GROQ_MODELS.MIXTRAL_8X7B,
    name: "Mixtral 8x7B",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      maxContextLength: 32768,
      systemInstructions: true,
    },
    temperatureRange: [0.0, 2.0],
    speed: 250,
    costPerInput: 0.27,
    costPerOutput: 0.27,
  },
  [GROQ_MODELS.GEMMA_2_9B]: {
    id: GROQ_MODELS.GEMMA_2_9B,
    name: "Gemma 2 9B IT",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      maxContextLength: 131072,
      systemInstructions: true,
    },
    temperatureRange: [0.0, 2.0],
    speed: 450,
    costPerInput: 0.20,
    costPerOutput: 0.20,
  },
  [GROQ_MODELS.LLAMA_4_SCOUT_17B]: {
    id: GROQ_MODELS.LLAMA_4_SCOUT_17B,
    name: "Llama 4 Scout 17B",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      maxContextLength: 131072,
      systemInstructions: true,
    },
    temperatureRange: [0.0, 2.0],
    speed: 30,
    costPerInput: 0.15,
    costPerOutput: 0.15,
  },
  [GROQ_MODELS.KIMI_K2_INSTRUCT]: {
    id: GROQ_MODELS.KIMI_K2_INSTRUCT,
    name: "Kimi K2 Instruct",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      maxContextLength: 131072,
      systemInstructions: true,
    },
    temperatureRange: [0.0, 2.0],
    speed: 60,
    costPerInput: 0.12,
    costPerOutput: 0.12,
  },
  [GROQ_MODELS.QWEN3_32B]: {
    id: GROQ_MODELS.QWEN3_32B,
    name: "Qwen 3 32B",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      maxContextLength: 131072,
      systemInstructions: true,
    },
    temperatureRange: [0.0, 2.0],
    speed: 60,
    costPerInput: 0.10,
    costPerOutput: 0.10,
  },
};

/**
 * Get model information
 */
export function getModelInfo(modelId: string): ModelInfo | undefined {
  return MODEL_REGISTRY[modelId];
}

/**
 * Check if model supports a capability
 */
export function modelSupports(modelId: string, capability: keyof ModelCapabilities): boolean {
  const info = getModelInfo(modelId);
  return Boolean(info?.capabilities[capability]);
}
