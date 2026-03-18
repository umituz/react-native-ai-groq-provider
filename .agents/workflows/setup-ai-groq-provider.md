---
description: Sets up or updates the @umituz/react-native-ai-groq-provider package in a React Native app.
---

# Groq AI Provider Setup Skill

When this workflow/skill is invoked, follow these explicit instructions to configure `@umituz/react-native-ai-groq-provider` for text-to-text language models.

## Step 1: Check and Update `package.json`
- Locate the target project's `package.json`.
- Check if `@umituz/react-native-ai-groq-provider` is installed.
  - If missing: Install with `npm install @umituz/react-native-ai-groq-provider`.
  - If outdated: Update it to the latest version.

## Step 2: Check Environment Variables
- Ensure that the Groq API key (usually `GROQ_API_KEY` or `EXPO_PUBLIC_GROQ_API_KEY`) is defined in the project's `.env.example` and `.env` files. If it is missing, prompt the user to add it.

## Step 3: Inject Provider Initialization
- Locate the app's initialization sequence or App layout.
- Import `initializeProvider` from `@umituz/react-native-ai-groq-provider`.
- Configure the provider early in the app lifecycle:
  ```typescript
  import { initializeProvider } from '@umituz/react-native-ai-groq-provider';

  // Inside initialization logic:
  initializeProvider({
    apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  });
  ```

// turbo
## Step 4: Run Pod Install (if applicable)
If targeting iOS and inside a bare minimum structure:
```bash
cd ios && pod install
```

## Step 5: Summary
Summarize the action: list which packages were upgraded/installed, the API keys ensured, and the file where the `initializeProvider` injection was completed.
