/**
 * OpenRouter Integration Patterns
 * 
 * This file demonstrates integration patterns for popular frameworks and
 * libraries including Vercel AI SDK, LangChain, and custom implementations.
 */

import OpenAI from 'openai';

// Vercel AI SDK Integration
export const vercelAiSdkIntegration = {
  // Basic streaming with Vercel AI SDK
  streamText: async () => {
    // Note: This requires @ai-sdk/openrouter package
    // Install with: bun add ai @ai-sdk/openrouter
    
    try {
      const { createOpenRouter } = await import('@ai-sdk/openrouter');
      const { streamText } = await import('ai');

      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
      });

      const result = await streamText({
        model: openrouter('openai/gpt-4o'),
        prompt: 'Write a short story about AI and creativity.',
        maxTokens: 500,
      });

      // Consume the stream
      let fullText = '';
      for await (const delta of result.textStream) {
        fullText += delta;
        process.stdout.write(delta);
      }

      return fullText;
    } catch (error) {
      console.error('Vercel AI SDK not available, using fallback...');
      return 'Vercel AI SDK integration requires @ai-sdk/openrouter package';
    }
  },

  // Tool calling with Vercel AI SDK
  toolCalling: async () => {
    try {
      const { createOpenRouter } = await import('@ai-sdk/openrouter');
      const { generateText } = await import('ai');
      const { z } = await import('zod');

      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
      });

      const result = await generateText({
        model: openrouter('openai/gpt-4o'),
        prompt: 'What is the weather like in San Francisco?',
        tools: {
          getCurrentWeather: {
            description: 'Get the current weather for a location',
            parameters: z.object({
              location: z.string().describe('The location to get weather for'),
              unit: z.enum(['celsius', 'fahrenheit']).optional(),
            }),
            execute: async ({ location, unit = 'celsius' }) => {
              // Mock weather API call
              return {
                location,
                temperature: unit === 'celsius' ? 18 : 64,
                condition: 'Partly cloudy',
                unit,
              };
            },
          },
        },
        maxToolRoundtrips: 3,
      });

      return result.text;
    } catch (error) {
      console.error('Tool calling integration failed:', error);
      return null;
    }
  },
};

// LangChain Integration
export const langchainIntegration = {
  // Basic LangChain ChatOpenAI setup
  createLangChainClient: () => {
    try {
      // This requires @langchain/openai package
      // Install with: bun add @langchain/openai
      
      const { ChatOpenAI } = require('@langchain/openai');
      
      return new ChatOpenAI({
        modelName: 'openai/gpt-4o',
        temperature: 0.7,
        openAIApiKey: process.env.OPENROUTER_API_KEY!,
      }, {
        basePath: 'https://openrouter.ai/api/v1',
        baseOptions: {
          headers: {
            'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
            'X-Title': process.env.APP_NAME || 'My App',
          },
        },
      });
    } catch (error) {
      console.error('LangChain not available');
      return null;
    }
  },

  // Chain example
  createChain: async () => {
    try {
      const { ChatPromptTemplate } = require('@langchain/core/prompts');
      const { StringOutputParser } = require('@langchain/core/output_parsers');
      
      const llm = langchainIntegration.createLangChainClient();
      if (!llm) return null;

      const prompt = ChatPromptTemplate.fromMessages([
        ['system', 'You are a helpful assistant that explains complex topics simply.'],
        ['human', 'Explain {topic} in simple terms'],
      ]);

      const outputParser = new StringOutputParser();
      const chain = prompt.pipe(llm).pipe(outputParser);

      return chain;
    } catch (error) {
      console.error('Failed to create LangChain chain:', error);
      return null;
    }
  },

  // Use the chain
  runChain: async (topic: string) => {
    const chain = await langchainIntegration.createChain();
    if (!chain) return 'LangChain not available';

    try {
      const result = await chain.invoke({ topic });
      return result;
    } catch (error: any) {
      console.error('Chain execution failed:', error);
      return `Error: ${error.message}`;
    }
  },
};

// Express.js/Hono Integration
export const webFrameworkIntegration = {
  // Express.js middleware and routes
  expressSetup: () => {
    return {
      // Middleware to add OpenRouter client to request
      middleware: (req: any, res: any, next: any) => {
        req.openrouter = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: process.env.OPENROUTER_API_KEY!,
          defaultHeaders: {
            'HTTP-Referer': req.headers.referer || req.headers.origin,
            'X-Title': process.env.APP_NAME || 'API Server',
          },
        });
        next();
      },

      // Chat completion route
      chatRoute: async (req: any, res: any) => {
        try {
          const { message, model = 'openai/gpt-4o' } = req.body;
          
          if (!message) {
            return res.status(400).json({ error: 'Message is required' });
          }

          const completion = await req.openrouter.chat.completions.create({
            model,
            messages: [{ role: 'user', content: message }],
            max_tokens: 500,
          });

          res.json({
            response: completion.choices[0]?.message?.content,
            model: completion.model,
          });
        } catch (error: any) {
          console.error('Chat route error:', error);
          res.status(500).json({ error: error.message });
        }
      },

      // Streaming route
      streamingRoute: async (req: any, res: any) => {
        try {
          const { message, model = 'openai/gpt-4o' } = req.body;
          
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });

          const stream = await req.openrouter.chat.completions.create({
            model,
            messages: [{ role: 'user', content: message }],
            stream: true,
          });

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }

          res.write('data: [DONE]\n\n');
          res.end();
        } catch (error: any) {
          res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          res.end();
        }
      },
    };
  },

  // Hono framework integration
  honoSetup: () => {
    return {
      // Hono middleware
      middleware: async (c: any, next: any) => {
        c.set('openrouter', new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: process.env.OPENROUTER_API_KEY!,
          defaultHeaders: {
            'HTTP-Referer': c.req.header('Referer') || c.req.header('Origin'),
            'X-Title': process.env.APP_NAME || 'Hono API',
          },
        }));
        await next();
      },

      // Chat endpoint
      chatHandler: async (c: any) => {
        try {
          const { message, model = 'openai/gpt-4o' } = await c.req.json();
          const openrouter = c.get('openrouter');

          const completion = await openrouter.chat.completions.create({
            model,
            messages: [{ role: 'user', content: message }],
            max_tokens: 500,
          });

          return c.json({
            response: completion.choices[0]?.message?.content,
            model: completion.model,
          });
        } catch (error: any) {
          return c.json({ error: error.message }, 500);
        }
      },

      // Streaming endpoint
      streamHandler: async (c: any) => {
        try {
          const { message, model = 'openai/gpt-4o' } = await c.req.json();
          const openrouter = c.get('openrouter');

          const stream = await openrouter.chat.completions.create({
            model,
            messages: [{ role: 'user', content: message }],
            stream: true,
          });

          return new Response(
            new ReadableStream({
              async start(controller) {
                try {
                  for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                      controller.enqueue(
                        new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                      );
                    }
                  }
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  controller.close();
                } catch (error) {
                  controller.error(error);
                }
              },
            }),
            {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              },
            }
          );
        } catch (error: any) {
          return c.json({ error: error.message }, 500);
        }
      },
    };
  },
};

// React/Next.js Integration
export const reactIntegration = {
  // React hook for OpenRouter
  useOpenRouter: () => {
    // This would typically be in a React component
    const sampleHook = `
import { useState, useCallback } from 'react';

export const useOpenRouter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chat = useCallback(async (message: string, model = 'openai/gpt-4o') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      return data.response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const streamChat = useCallback(async (message: string, onChunk: (chunk: string) => void) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { chat, streamChat, loading, error };
};
    `;

    return sampleHook;
  },

  // Next.js API route examples
  nextjsApiRoutes: () => {
    return {
      chatRoute: `
// pages/api/chat.ts or app/api/chat/route.ts
import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { message, model = 'openai/gpt-4o' } = await request.json();

    const completion = await openrouter.chat.completions.create({
      model,
      messages: [{ role: 'user', content: message }],
      max_tokens: 500,
    });

    return Response.json({
      response: completion.choices[0]?.message?.content,
      model: completion.model,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
      `,
      streamingRoute: `
// pages/api/stream.ts or app/api/stream/route.ts
export async function POST(request: Request) {
  const { message, model = 'openai/gpt-4o' } = await request.json();

  const stream = await openrouter.chat.completions.create({
    model,
    messages: [{ role: 'user', content: message }],
    stream: true,
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(
              new TextEncoder().encode(\`data: \${JSON.stringify({ content })}\\n\\n\`)
            );
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\\n\\n'));
        controller.close();
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
}
      `,
    };
  },
};

// Database Integration Patterns
export const databaseIntegration = {
  // Store conversations in database
  conversationStorage: {
    // Example with Prisma ORM
    prismaExample: `
// schema.prisma
model Conversation {
  id        String   @id @default(cuid())
  userId    String
  title     String?
  model     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Message[]
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  role           String       // 'user', 'assistant', 'system'
  content        String       @db.Text
  tokenCount     Int?
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}

// Usage in API
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const saveConversation = async (userId: string, messages: any[], model: string) => {
  return await prisma.conversation.create({
    data: {
      userId,
      model,
      title: messages[0]?.content?.slice(0, 50) + '...',
      messages: {
        create: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          tokenCount: estimateTokenCount(msg.content),
        })),
      },
    },
    include: {
      messages: true,
    },
  });
};
    `,

    // Example with raw SQL
    sqlExample: `
-- Database schema
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  title VARCHAR,
  model VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  token_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage in Node.js
const saveMessage = async (conversationId: string, role: string, content: string) => {
  const tokenCount = estimateTokenCount(content);
  
  await db.query(
    'INSERT INTO messages (conversation_id, role, content, token_count) VALUES ($1, $2, $3, $4)',
    [conversationId, role, content, tokenCount]
  );
};
    `,
  },

  // Usage tracking and analytics
  usageTracking: `
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const trackUsage = async (userId: string, model: string, promptTokens: number, completionTokens: number) => {
  await prisma.usage.create({
    data: {
      userId,
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost: calculateCost(model, promptTokens, completionTokens),
    },
  });
};

export const getUserUsage = async (userId: string, timeframe = '30 days') => {
  return await prisma.usage.aggregate({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    _sum: {
      totalTokens: true,
      cost: true,
    },
    _count: {
      id: true,
    },
  });
};
  `,
};

// Queue and Background Processing
export const queueIntegration = {
  // Bull/BullMQ integration for background processing
  bullMqExample: `
import { Queue, Worker } from 'bullmq';
import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Create a queue for AI processing
const aiQueue = new Queue('ai-processing', {
  connection: { host: 'localhost', port: 6379 },
});

// Add job to queue
export const queueAiTask = async (prompt: string, options: any = {}) => {
  return await aiQueue.add('process', {
    prompt,
    model: options.model || 'openai/gpt-4o',
    maxTokens: options.maxTokens || 500,
  }, {
    attempts: 3,
    backoff: 'exponential',
  });
};

// Worker to process AI tasks
const worker = new Worker('ai-processing', async (job) => {
  const { prompt, model, maxTokens } = job.data;
  
  const completion = await openrouter.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
  });

  return {
    response: completion.choices[0]?.message?.content,
    model: completion.model,
  };
}, {
  connection: { host: 'localhost', port: 6379 },
});

worker.on('completed', (job, result) => {
  console.log(\`Job \${job.id} completed with result:\`, result);
});
  `,
};

// Example usage and testing
export const runIntegrationExamples = async () => {
  try {
    console.log('=== OpenRouter Integration Examples ===\n');

    console.log('1. Vercel AI SDK Integration:');
    const vercelResult = await vercelAiSdkIntegration.streamText();
    console.log('Result:', vercelResult?.substring(0, 100) + '...\n');

    console.log('2. LangChain Integration:');
    const langchainResult = await langchainIntegration.runChain('quantum physics');
    console.log('Result:', langchainResult?.substring(0, 100) + '...\n');

    console.log('3. Web Framework Integration:');
    console.log('Express and Hono setup examples provided in code\n');

    console.log('4. React Integration:');
    console.log('React hooks and Next.js API routes examples provided\n');

    console.log('5. Database Integration:');
    console.log('Prisma and SQL examples for conversation storage\n');

  } catch (error) {
    console.error('Error running integration examples:', error);
  }
};