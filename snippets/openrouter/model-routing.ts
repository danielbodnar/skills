/**
 * OpenRouter Model Routing Examples
 * 
 * This file demonstrates advanced model routing features including
 * fallbacks, provider selection, and performance optimization.
 */

import OpenAI from 'openai';

// Client setup
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Basic model fallback
export const modelFallback = async (prompt: string) => {
  const completion = await client.chat.completions.create({
    model: 'openai/gpt-4o',
    // @ts-expect-error - OpenRouter extension
    models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-3.5-turbo'],
    messages: [{ role: 'user', content: prompt }],
  });

  return {
    content: completion.choices[0]?.message?.content,
    model: completion.model, // Shows which model was actually used
  };
};

// Route to cheapest provider
export const cheapestRoute = async (prompt: string) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-70b-instruct:floor', // :floor suffix for cheapest
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  return data;
};

// Route to fastest provider
export const fastestRoute = async (prompt: string) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-70b-instruct:nitro', // :nitro suffix for fastest
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  return data;
};

// Custom provider routing
export const customProviderRouting = async (prompt: string) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      provider: {
        sort: 'price', // Sort by price
        only: ['openai', 'azure'], // Only use these providers
        ignore: ['anthropic'], // Don't use this provider
        quantizations: ['fp16'], // Require specific quantization
      },
    }),
  });

  const data = await response.json();
  return data;
};

// Task-specific model selection
export const taskSpecificModels = {
  // For coding tasks
  coding: async (codePrompt: string) => {
    return await client.chat.completions.create({
      model: 'meta-llama/codellama-34b-instruct',
      // @ts-expect-error - OpenRouter extension
      models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
      messages: [
        { role: 'system', content: 'You are an expert programmer.' },
        { role: 'user', content: codePrompt }
      ],
      temperature: 0.1, // Lower temperature for code
    });
  },

  // For creative tasks
  creative: async (creativePrompt: string) => {
    return await client.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      // @ts-expect-error - OpenRouter extension
      models: ['openai/gpt-4o', 'google/gemini-pro'],
      messages: [
        { role: 'system', content: 'You are a creative writing assistant.' },
        { role: 'user', content: creativePrompt }
      ],
      temperature: 0.9, // Higher temperature for creativity
    });
  },

  // For analysis tasks
  analysis: async (analysisPrompt: string) => {
    return await client.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      // @ts-expect-error - OpenRouter extension
      models: ['openai/gpt-4o', 'google/gemini-pro'],
      messages: [
        { role: 'system', content: 'You are an analytical reasoning expert.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3, // Moderate temperature for analysis
    });
  },

  // For cost-sensitive tasks
  economical: async (prompt: string) => {
    return await client.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      // @ts-expect-error - OpenRouter extension
      models: ['anthropic/claude-haiku', 'google/gemini-flash'],
      messages: [{ role: 'user', content: prompt }],
      // @ts-expect-error - OpenRouter extension
      provider: { sort: 'price' },
    });
  },
};

// Model performance comparison
export const compareModels = async (prompt: string) => {
  const models = [
    'openai/gpt-4o',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-pro',
    'meta-llama/llama-3.1-70b-instruct',
  ];

  const results = await Promise.allSettled(
    models.map(async (model) => {
      const start = Date.now();
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
        });
        
        const end = Date.now();
        return {
          model,
          content: completion.choices[0]?.message?.content,
          latency: end - start,
          success: true,
        };
      } catch (error: any) {
        const end = Date.now();
        return {
          model,
          error: error.message,
          latency: end - start,
          success: false,
        };
      }
    })
  );

  return results.map((result, index) => ({
    model: models[index],
    ...(result.status === 'fulfilled' ? result.value : { error: result.reason }),
  }));
};

// Smart routing based on context length
export const contextAwareRouting = async (messages: any[], maxTokens = 4000) => {
  // Estimate token count (rough approximation)
  const estimatedTokens = JSON.stringify(messages).length / 4;
  
  let selectedModel: string;
  let fallbacks: string[];

  if (estimatedTokens > 100000) {
    // Long context models
    selectedModel = 'anthropic/claude-3.5-sonnet';
    fallbacks = ['google/gemini-pro', 'openai/gpt-4-turbo'];
  } else if (estimatedTokens > 30000) {
    // Medium context models
    selectedModel = 'openai/gpt-4o';
    fallbacks = ['anthropic/claude-3.5-sonnet', 'google/gemini-pro'];
  } else {
    // Standard models
    selectedModel = 'openai/gpt-4o';
    fallbacks = ['anthropic/claude-3.5-sonnet', 'openai/gpt-3.5-turbo'];
  }

  return await client.chat.completions.create({
    model: selectedModel,
    // @ts-expect-error - OpenRouter extension
    models: fallbacks,
    messages,
    max_tokens: maxTokens,
  });
};

// Load balancing across providers
export const loadBalancedRequest = async (prompts: string[]) => {
  const providers = ['openai', 'anthropic', 'google'];
  
  const promises = prompts.map(async (prompt, index) => {
    const preferredProvider = providers[index % providers.length];
    
    return await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o', // Base model
        messages: [{ role: 'user', content: prompt }],
        provider: {
          prefer: [preferredProvider], // Prefer this provider
        },
      }),
    }).then(res => res.json());
  });

  return await Promise.all(promises);
};

// Example usage
export const runRoutingExamples = async () => {
  try {
    console.log('Model fallback test:');
    const fallbackResult = await modelFallback('Explain quantum computing');
    console.log(`Used model: ${fallbackResult.model}`);
    
    console.log('\nCheapest route test:');
    const cheapResult = await cheapestRoute('What is 2+2?');
    console.log(`Cheapest provider result: ${cheapResult.choices[0]?.message?.content}`);
    
    console.log('\nTask-specific coding example:');
    const codingResult = await taskSpecificModels.coding('Write a function to sort an array');
    console.log(`Coding response: ${codingResult.choices[0]?.message?.content?.substring(0, 100)}...`);
    
    console.log('\nModel comparison:');
    const comparison = await compareModels('What is the capital of France?');
    comparison.forEach(result => {
      console.log(`${result.model}: ${result.success ? 'Success' : 'Failed'} (${result.latency}ms)`);
    });

  } catch (error) {
    console.error('Error running routing examples:', error);
  }
};