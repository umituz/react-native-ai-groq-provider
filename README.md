# @umituz/react-native-ai-groq-provider

Groq text generation provider for React Native applications. This package provides a clean, type-safe interface to Groq's ultra-fast LLM API.

## Features

- 🚀 **Ultra-fast inference** - Groq delivers up to 1000 tokens/second
- 💰 **Affordable pricing** - Starting from $0.05 per 1M tokens
- 🎯 **Multiple models** - Llama 3.1 8B, Llama 3.3 70B, GPT-OSS, and more
- 🔄 **Streaming support** - Real-time streaming responses
- 📦 **Structured output** - Generate JSON with schema validation
- 💬 **Chat sessions** - Multi-turn conversation management
- 🔒 **Type-safe** - Full TypeScript support
- 🪝 **React Hooks** - Easy integration with React/React Native

## Installation

```bash
npm install @umituz/react-native-ai-groq-provider
# or
yarn add @umituz/react-native-ai-groq-provider
```

## Getting Started

### 1. Get a Groq API Key

Sign up at [console.groq.com](https://console.groq.com) and get your API key.

### 2. Initialize the Provider

```typescript
import { configureProvider } from "@umituz/react-native-ai-groq-provider";

// Initialize with your API key
configureProvider({
  apiKey: "your-groq-api-key",
  defaultModel: "llama-3.3-70b-versatile", // Optional
});
```

### 3. Use the useGroq Hook

```typescript
import { useGroq } from "@umituz/react-native-ai-groq-provider";

function MyComponent() {
  const { generate, isLoading, error, result } = useGroq();

  const handleGenerate = async () => {
    try {
      const response = await generate("Write a short poem about coding");
      console.log(response);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View>
      <Button onPress={handleGenerate} disabled={isLoading} />
      {isLoading && <Text>Loading...</Text>}
      {error && <Text>Error: {error}</Text>}
      {result && <Text>{result}</Text>}
    </View>
  );
}
```

## Usage Examples

### Basic Text Generation

```typescript
import { textGeneration } from "@umituz/react-native-ai-groq-provider";

const result = await textGeneration("Explain quantum computing in simple terms");
```

### Chat Conversation

```typescript
import { chatGeneration } from "@umituz/react-native-ai-groq-provider";

const messages = [
  { role: "user", content: "What is React Native?" },
  { role: "assistant", content: "React Native is..." },
  { role: "user", content: "How does it differ from React?" },
];

const response = await chatGeneration(messages);
```

### Structured JSON Output

```typescript
import { structuredText } from "@umituz/react-native-ai-groq-provider";

interface TodoItem {
  title: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
}

const todos = await structuredText<TodoItem>(
  "Create a todo item for learning Groq API",
  {
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        completed: { type: "boolean" },
      },
    },
  }
);
```

### Streaming Responses

```typescript
import { useGroq } from "@umituz/react-native-ai-groq-provider";

function StreamingComponent() {
  const { stream } = useGroq();

  const handleStream = async () => {
    let fullText = "";
    await stream(
      "Tell me a story",
      (chunk) => {
        fullText += chunk;
        console.log("Received chunk:", chunk);
        // Update UI with chunk
      }
    );
  };

  return <Button onPress={handleStream} />;
}
```

### Chat Sessions

```typescript
import {
  createChatSession,
  sendChatMessage,
} from "@umituz/react-native-ai-groq-provider";

// Create a chat session
const session = createChatSession({
  model: "llama-3.3-70b-versatile",
  systemInstruction: "You are a helpful assistant.",
});

// Send messages
const result1 = await sendChatMessage(session.id, "Hello!");
console.log(result1.response);

const result2 = await sendChatMessage(session.id, "How are you?");
console.log(result2.response);
```

## Available Models

| Model | Speed | Context | Best For |
|-------|-------|---------|----------|
| `llama-3.1-8b-instant` | 560 T/s | 128K | Fast responses, simple tasks |
| `llama-3.3-70b-versatile` | 280 T/s | 128K | General purpose, complex tasks |
| `llama-3.1-70b-versatile` | 280 T/s | 128K | General purpose |
| `openai/gpt-oss-20b` | 1000 T/s | 128K | Experimental, fastest |
| `openai/gpt-oss-120b` | 400 T/s | 128K | Large tasks |
| `mixtral-8x7b-32768` | 250 T/s | 32K | MoE model |
| `gemma2-9b-it` | 450 T/s | 128K | Google's model |

## Configuration

### Provider Configuration

```typescript
import { configureProvider } from "@umituz/react-native-ai-groq-provider";

configureProvider({
  apiKey: "your-api-key",
  baseUrl: "https://api.groq.com/openai/v1", // Optional, default
  timeoutMs: 60000, // Optional, default 60s
  defaultModel: "llama-3.3-70b-versatile", // Optional
});
```

### Generation Configuration

```typescript
import { GenerationConfigBuilder } from "@umituz/react-native-ai-groq-provider";

const config = GenerationConfigBuilder.create()
  .withTemperature(0.7)
  .withMaxTokens(1024)
  .withTopP(0.9)
  .build();

await textGeneration("Your prompt", { generationConfig: config });
```

## Error Handling

```typescript
import {
  getUserFriendlyError,
  isRetryableError,
  isAuthError,
} from "@umituz/react-native-ai-groq-provider";

try {
  const result = await textGeneration("Your prompt");
} catch (error) {
  const friendlyMessage = getUserFriendlyError(error);
  console.log(friendlyMessage);

  if (isRetryableError(error)) {
    // Retry the request
  }

  if (isAuthError(error)) {
    // Check API key
  }
}
```

## API Reference

### Hooks

- `useGroq(options?)` - Main hook for text generation
- `useOperationManager()` - Manage async operations

### Services

- `textGeneration(prompt, options?)` - Generate text from prompt
- `chatGeneration(messages, options?)` - Generate from chat history
- `structuredText<T>(prompt, options?)` - Generate structured JSON
- `streaming(prompt, options?)` - Stream text generation
- `createChatSession(config?)` - Create chat session
- `sendChatMessage(sessionId, content, options?)` - Send message in session

### Utilities

- `ConfigBuilder` - Build provider configuration
- `GenerationConfigBuilder` - Build generation configuration
- `providerFactory` - Factory for provider instances

## License

MIT

## Links

- [Groq Documentation](https://console.groq.com/docs)
- [Groq Models](https://console.groq.com/docs/models)
- [GitHub](https://github.com/umituz/react-native-ai-groq-provider)

## Author

umituz
