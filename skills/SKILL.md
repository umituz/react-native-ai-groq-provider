---
name: setup-react-native-ai-groq-provider
description: Sets up Groq AI provider for React Native apps with automated installation and configuration. Triggers on: Setup Groq AI, install Groq provider, Groq API, text generation, useGroq, AI chat, LLaMA models, Mixtral models, fast inference.
---

# Setup React Native AI - Groq Provider

Comprehensive setup for `@umituz/react-native-ai-groq-provider` - Groq AI integration with ultra-fast inference.

## Overview

This skill handles everything needed to integrate Groq AI into your React Native or Expo app:
- Package installation and updates
- API key configuration
- Provider setup and initialization
- Text generation with Groq models
- Streaming responses
- Structured JSON generation
- Multi-model support (LLaMA, Mixtral, Gemma)

## Quick Start

Just say: **"Setup Groq AI in my app"** and this skill will handle everything.

**Why Groq?**
- Ultra-fast inference (up to 10x faster than competitors)
- Free tier available
- Multiple open-source models (LLaMA, Mixtral, Gemma)
- Simple API integration

## When to Use

Invoke this skill when you need to:
- Install @umituz/react-native-ai-groq-provider
- Set up Groq API for text generation
- Add AI chat features
- Implement fast LLM inference
- Use open-source models (LLaMA, Mixtral)
- Add streaming text generation

## Step 1: Analyze the Project

### Check package.json

```bash
cat package.json | grep "@umituz/react-native-ai-groq-provider"
npm list @umituz/react-native-ai-groq-provider
```

### Detect Project Type

```bash
cat app.json | grep -q "expo" && echo "Expo" || echo "Bare RN"
```

## Step 2: Install Package

### Install or Update

```bash
npm install @umituz/react-native-ai-groq-provider@latest
```

### Install Dependencies

```bash
# Required core dependencies
npm install @umituz/react-native-ai-generation-content
npm install @umituz/react-native-design-system

# Groq SDK (if not included)
npm install groq-sdk
```

## Step 3: Get Groq API Key

### Create API Key

1. Go to https://console.groq.com/keys
2. Sign up or log in
3. Click "Create Key"
4. Copy the API key

### Add to Environment Variables

Create or update `.env`:

```bash
cat > .env.example << 'EOF'
# Groq AI Configuration
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
EOF

# Add to .env
echo "EXPO_PUBLIC_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx" >> .env
```

### Verify API Key

```bash
grep EXPO_PUBLIC_GROQ_API_KEY .env
```

## Step 4: Initialize Groq Provider

### Set Up Provider

In your app entry point (`app/_layout.tsx` or `App.tsx`):

```typescript
import { GroqProvider } from '@umituz/react-native-ai-groq-provider';
import { ConfigProvider } from '@umituz/react-native-ai-generation-content';

export default function RootLayout() {
  const groqConfig = {
    apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY!,
    defaultModel: 'llama-3.3-70b-versatile', // or 'mixtral-8x7b-32768'
  };

  return (
    <GroqProvider config={groqConfig}>
      <ConfigProvider>
        <Stack>{/* your screens */}</Stack>
      </ConfigProvider>
    </GroqProvider>
  );
}
```

### Alternative: Manual Initialization

```typescript
import { initializeProvider } from '@umituz/react-native-ai-groq-provider';

export default function RootLayout() {
  useEffect(() => {
    initializeProvider({
      apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY!,
    });
  }, []);

  return <Stack>{/* your screens */}</Stack>;
}
```

### Check If Already Configured

```bash
grep -r "GroqProvider\|initializeProvider" app/ App.tsx 2>/dev/null
```

## Step 5: Use Text Generation

### Basic Text Generation

```typescript
import { useGroq } from '@umituz/react-native-ai-groq-provider';

export function TextGenerationScreen() {
  const { generateText, result, isLoading, error } = useGroq({
    model: 'llama-3.3-70b-versatile',
  });

  const [prompt, setPrompt] = useState('Explain quantum computing in simple terms');

  const handleGenerate = async () => {
    try {
      const response = await generateText({
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 1000,
      });

      console.log('Generated text:', response.text);
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  return (
    <View>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Enter your prompt..."
        multiline
      />

      {isLoading && <ActivityIndicator />}

      {result && <Text>{result.text}</Text>}

      <Button
        title="Generate"
        onPress={handleGenerate}
        disabled={isLoading}
      />
    </View>
  );
}
```

## Step 6: Multi-turn Conversations

### Chat Interface

```typescript
import { useGroq } from '@umituz/react-native-ai-groq-provider';

export function ChatScreen() {
  const { generateText } = useGroq({
    model: 'llama-3.3-70b-versatile',
  });

  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a helpful assistant.' },
  ]);

  const sendMessage = async (userMessage: string) => {
    // Add user message
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage },
    ];

    const response = await generateText({
      messages: newMessages,
      temperature: 0.7,
    });

    // Add assistant response
    setMessages([
      ...newMessages,
      { role: 'assistant', content: response.text },
    ]);

    return response.text;
  };

  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => (
        <View style={{
          alignItems: item.role === 'user' ? 'flex-end' : 'flex-start'
        }}>
          <Text>{item.role}: {item.content}</Text>
        </View>
      )}
    />
  );
}
```

## Step 7: Streaming Responses

### Streaming Text Generation

```typescript
import { useGroq } from '@umituz/react-native-ai-groq-provider';

export function StreamingScreen() {
  const { generateTextStream } = useGroq({
    model: 'llama-3.3-70b-versatile',
  });

  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleStream = async () => {
    setIsStreaming(true);
    setStreamedText('');

    try {
      await generateTextStream({
        prompt: 'Tell me a short story about AI',
        onChunk: (chunk) => {
          setStreamedText((prev) => prev + chunk);
        },
      });
    } catch (err) {
      console.error('Stream failed:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <View>
      <ScrollView>
        <Text>{streamedText || 'Waiting for stream...'}</Text>
      </ScrollView>

      {isStreaming && <ActivityIndicator />}

      <Button
        title="Start Stream"
        onPress={handleStream}
        disabled={isStreaming}
      />
    </View>
  );
}
```

## Step 8: Use Different Models

### Available Groq Models

```typescript
import { useGroq } from '@umituz/react-native-ai-groq-provider';

// LLaMA 3.3 - Most capable
const llamaModel = useGroq({
  model: 'llama-3.3-70b-versatile',
});

// Mixtral 8x7b - Fast and efficient
const mixtralModel = useGroq({
  model: 'mixtral-8x7b-32768',
});

// Gemma 2 9b - Lightweight
const gemmaModel = useGroq({
  model: 'gemma2-9b-it',
});

// LLaMA 3.1 8b - Fast
const llama8b = useGroq({
  model: 'llama-3.1-8b-instant',
});
```

### Model Selection Guide

| Model | Use Case | Speed | Quality |
|-------|----------|-------|---------|
| llama-3.3-70b-versatile | Complex reasoning, long context | Medium | Best |
| mixtral-8x7b-32768 | Fast multi-task | Fast | High |
| gemma2-9b-it | Lightweight tasks | Fastest | Good |
| llama-3.1-8b-instant | Quick responses | Fastest | Good |

## Step 9: Error Handling

### Handle Common Errors

```typescript
import { GroqErrorType, useGroq } from '@umituz/react-native-ai-groq-provider';

export function GenerationScreen() {
  const { generateText, error, isLoading } = useGroq({
    model: 'llama-3.3-70b-versatile',
  });

  const handleGenerate = async () => {
    try {
      const result = await generateText({
        prompt: 'Generate some text',
      });
      return result;
    } catch (err) {
      if (error?.type === GroqErrorType.INVALID_API_KEY) {
        Alert.alert('Invalid API Key', 'Check your Groq API key');
      } else if (error?.type === GroqErrorType.RATE_LIMIT) {
        Alert.alert('Rate Limit', 'Too many requests, please wait');
      } else if (error?.type === GroqErrorType.QUOTA_EXCEEDED) {
        Alert.alert('Quota Exceeded', 'You have exceeded your quota');
      } else if (error?.type === GroqErrorType.NETWORK_ERROR) {
        Alert.alert('Network Error', 'Check your internet connection');
      } else {
        Alert.alert('Error', error?.message || 'Generation failed');
      }
    }
  };

  return <View>{/* UI */}</View>;
}
```

## Step 10: Verify Setup

### Run the App

```bash
# For Expo
npx expo start

# For bare React Native
npx react-native run-ios
# or
npx react-native run-android
```

### Verification Checklist

- ✅ Package installed
- ✅ API key configured
- ✅ GroqProvider or initializeProvider in place
- ✅ Text generation works
- ✅ Streaming works
- ✅ Multiple models can be used
- ✅ Error handling works

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Missing API key | Add EXPO_PUBLIC_GROQ_API_KEY to .env |
| Invalid API key format | Groq keys start with `gsk_` |
| Provider not initialized | Call initializeProvider or wrap with GroqProvider |
| Wrong model name | Use valid model names (llama-3.3-70b-versatile, etc.) |
| Streaming not working | Ensure onChunk callback is provided |
| Rate limit errors | Implement exponential backoff |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Invalid API key"** | Check key format and verify at console.groq.com |
| **"Rate limit exceeded"** | Groq has rate limits - implement delays between requests |
| **"Model not found"** | Verify model name is supported by Groq |
| **"Stream not working"** | Ensure onChunk callback is properly provided |
| **"Network error"** | Check internet connection and API status |
| **"Provider not initialized"** | Ensure initializeProvider is called or GroqProvider wraps app |

## Groq Models

### LLaMA Models

- **llama-3.3-70b-versatile** - Most capable, 70B parameters
- **llama-3.1-8b-instant** - Fast responses, 8B parameters
- **llama-3.1-70b-versatile** - High quality, 70B parameters

### Mixtral Models

- **mixtral-8x7b-32768** - Mixture of Experts, 32K context

### Gemma Models

- **gemma2-9b-it** - Lightweight, 9B parameters

## Pricing and Limits

### Free Tier

- 30 requests per minute
- 14,400 requests per day
- Rate limits apply

### Paid Tier

- Higher rate limits
- Priority processing
- Pay-per-use after free tier

See https://console.groq.com/settings/usage for current limits.

## Performance Tips

### Optimize for Speed

```typescript
// Use smaller models for simple tasks
const fastModel = useGroq({
  model: 'llama-3.1-8b-instant', // Faster
});

// Reduce max tokens for shorter responses
await generateText({
  prompt: 'Quick summary',
  maxTokens: 100, // Less time to generate
});

// Use lower temperature for deterministic output
await generateText({
  prompt: 'Factual response',
  temperature: 0.1, // Less random = faster
});
```

### Batch Requests

```typescript
// Generate multiple requests in parallel
const results = await Promise.all([
  generateText({ prompt: 'Task 1' }),
  generateText({ prompt: 'Task 2' }),
  generateText({ prompt: 'Task 3' }),
]);
```

## Summary

After setup, provide:

1. ✅ Package version installed
2. ✅ API key configured
3. ✅ Provider initialization location
4. ✅ Model(s) configured
5. ✅ Generation features working
6. ✅ Streaming configured
7. ✅ Verification status

---

**Compatible with:** @umituz/react-native-ai-groq-provider@latest
**Platforms:** React Native (Expo & Bare)
**API:** Groq (https://groq.com/)
**Cost:** Free tier available (30 requests/min, 14,400/day)
**Speed:** Ultra-fast inference (up to 10x faster)
