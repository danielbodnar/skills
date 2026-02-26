/**
 * OpenRouter Basic Usage Examples
 * 
 * This file demonstrates fundamental patterns for using OpenRouter API
 * with the OpenAI SDK and native fetch approaches.
 */

import OpenAI from 'openai';

// Basic OpenRouter client setup
export const createOpenRouterClient = (apiKey: string) => {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
      'X-Title': process.env.APP_NAME || 'My AI App',
    },
  });
};

// Simple chat completion
export const basicChatCompletion = async () => {
  const client = createOpenRouterClient(process.env.OPENROUTER_API_KEY!);

  const completion = await client.chat.completions.create({
    model: 'openai/gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello! How are you today?' }
    ],
    max_tokens: 150,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content;
};

// Using native fetch instead of OpenAI SDK
export const fetchCompletion = async (message: string) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
      'X-Title': process.env.APP_NAME || 'My AI App',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'user', content: message }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content;
};

// Streaming responses
export const streamingChat = async function* (message: string) {
  const client = createOpenRouterClient(process.env.OPENROUTER_API_KEY!);

  const stream = await client.chat.completions.create({
    model: 'openai/gpt-4o',
    messages: [{ role: 'user', content: message }],
    stream: true,
    max_tokens: 500,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
};

// Get available models
export const getAvailableModels = async () => {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data; // Array of model objects
};

// Check account credits
export const getCredits = async () => {
  const response = await fetch('https://openrouter.ai/api/v1/credits', {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get credits: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

// Assistant prefill example
export const assistantPrefill = async () => {
  const client = createOpenRouterClient(process.env.OPENROUTER_API_KEY!);

  const completion = await client.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      { role: 'user', content: 'What is the meaning of life?' },
      { role: 'assistant', content: "I'm not sure, but my best guess is" },
    ],
  });

  return completion.choices[0]?.message?.content;
};

// Multiple conversation turns
export const conversationExample = async () => {
  const client = createOpenRouterClient(process.env.OPENROUTER_API_KEY!);

  const messages = [
    { role: 'system' as const, content: 'You are a helpful coding assistant.' },
    { role: 'user' as const, content: 'How do I create a TypeScript function?' },
  ];

  const firstResponse = await client.chat.completions.create({
    model: 'openai/gpt-4o',
    messages,
  });

  const assistantMessage = firstResponse.choices[0]?.message?.content;
  if (assistantMessage) {
    messages.push({ role: 'assistant', content: assistantMessage });
    messages.push({ role: 'user', content: 'Can you show me an example with parameters?' });

    const secondResponse = await client.chat.completions.create({
      model: 'openai/gpt-4o',
      messages,
    });

    return {
      firstResponse: assistantMessage,
      secondResponse: secondResponse.choices[0]?.message?.content,
      conversation: messages,
    };
  }
};

// Error handling example
export const robustCompletion = async (prompt: string, retries = 3) => {
  const client = createOpenRouterClient(process.env.OPENROUTER_API_KEY!);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content;
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        throw new Error(`All ${retries} attempts failed. Last error: ${error.message}`);
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Example usage
export const runExamples = async () => {
  try {
    console.log('Basic completion:', await basicChatCompletion());
    console.log('Credits:', await getCredits());
    console.log('Available models count:', (await getAvailableModels()).length);
    
    // Streaming example
    console.log('Streaming response:');
    for await (const chunk of streamingChat('Write a short poem about AI')) {
      process.stdout.write(chunk);
    }
    console.log('\n');

  } catch (error) {
    console.error('Error running examples:', error);
  }
};