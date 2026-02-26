// Claude Messages API Examples

import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 1. Basic Message Creation
export async function basicMessage() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: 'Explain the concept of async/await in JavaScript'
      }
    ]
  });

  return response.content[0].text;
}

// 2. System Message with Context
export async function systemMessage() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    system: 'You are a senior JavaScript developer specializing in Node.js and TypeScript. Provide practical, production-ready code examples.',
    messages: [
      {
        role: 'user',
        content: 'How do I implement JWT authentication in Express.js?'
      }
    ]
  });

  return response;
}

// 3. Multi-turn Conversation
export async function multiTurnConversation() {
  const messages = [
    { role: 'user' as const, content: 'I need help building a REST API' },
    { role: 'assistant' as const, content: 'I\'d be happy to help you build a REST API. What programming language and framework would you like to use?' },
    { role: 'user' as const, content: 'I want to use Node.js with Express and TypeScript' },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    messages: messages
  });

  return response;
}

// 4. Temperature and Sampling Control
export async function creativeResponse() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    temperature: 0.8, // Higher for more creative responses
    top_p: 0.9,
    messages: [
      {
        role: 'user',
        content: 'Generate creative names for a new tech startup focused on AI-powered code review'
      }
    ]
  });

  return response;
}

// 5. Deterministic Response
export async function deterministicResponse() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    temperature: 0, // Lower for consistent responses
    messages: [
      {
        role: 'user',
        content: 'Write a function to validate email addresses in TypeScript'
      }
    ]
  });

  return response;
}

// 6. Stop Sequences
export async function stopSequences() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    stop_sequences: ['```', 'END_CODE'],
    messages: [
      {
        role: 'user',
        content: 'Write a simple TypeScript function and stop after the code block:'
      }
    ]
  });

  return response;
}

// 7. Metadata and Tracking
export async function messageWithMetadata() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    metadata: {
      user_id: 'user_123',
      session_id: 'session_456',
      request_type: 'code_generation'
    },
    messages: [
      {
        role: 'user',
        content: 'Generate a TypeScript interface for a user profile'
      }
    ]
  });

  return response;
}

// 8. Error Handling and Retries
export async function robustMessageCreation() {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: 'Explain database indexing strategies'
          }
        ]
      });

      return response;
    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, error);

      if (error.status === 429) {
        // Rate limit - wait before retry
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (error.status >= 500) {
        // Server error - retry with exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // Client error - don't retry
        throw error;
      }

      if (attempt >= maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }
    }
  }
}

// 9. Batch Processing
export async function batchProcessing() {
  const prompts = [
    'Explain React hooks',
    'What is TypeScript?',
    'How does async/await work?',
    'Explain REST API design principles'
  ];

  const responses = await Promise.allSettled(
    prompts.map(prompt =>
      anthropic.messages.create({
        model: 'claude-3-haiku-20240307', // Use faster model for batch
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    )
  );

  const results = responses.map((response, index) => ({
    prompt: prompts[index],
    success: response.status === 'fulfilled',
    content: response.status === 'fulfilled' ? response.value.content[0].text : null,
    error: response.status === 'rejected' ? response.reason.message : null
  }));

  return results;
}

// 10. Cost Optimization
export class CostOptimizedClient {
  private client: Anthropic;
  private tokenUsage: { input: number; output: number } = { input: 0, output: 0 };

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async createMessage(params: any) {
    // Choose model based on complexity
    const model = this.selectOptimalModel(params.messages[0].content);
    
    const response = await this.client.messages.create({
      ...params,
      model
    });

    // Track usage
    this.tokenUsage.input += response.usage.input_tokens;
    this.tokenUsage.output += response.usage.output_tokens;

    return response;
  }

  private selectOptimalModel(content: string): string {
    const complexity = this.assessComplexity(content);
    
    if (complexity < 0.3) {
      return 'claude-3-haiku-20240307'; // Fastest, cheapest
    } else if (complexity < 0.7) {
      return 'claude-3-sonnet-20240229'; // Balanced
    } else {
      return 'claude-3-opus-20240229'; // Most capable
    }
  }

  private assessComplexity(content: string): number {
    // Simple heuristic for complexity assessment
    const indicators = [
      /complex|difficult|challenging/i,
      /architecture|design|system/i,
      /analyze|review|evaluate/i,
      /optimize|performance|scale/i
    ];

    const matches = indicators.reduce((count, pattern) => 
      count + (pattern.test(content) ? 1 : 0), 0
    );

    return Math.min(matches / indicators.length, 1);
  }

  getUsageStats() {
    return {
      ...this.tokenUsage,
      estimatedCost: this.calculateCost()
    };
  }

  private calculateCost(): number {
    // Approximate costs (adjust based on current pricing)
    const inputCost = this.tokenUsage.input * 0.00001;
    const outputCost = this.tokenUsage.output * 0.00003;
    return inputCost + outputCost;
  }
}

export {
  basicMessage,
  systemMessage,
  multiTurnConversation,
  creativeResponse,
  deterministicResponse,
  stopSequences,
  messageWithMetadata,
  robustMessageCreation,
  batchProcessing,
  CostOptimizedClient
};