/**
 * OpenRouter Tool Calling Examples
 * 
 * This file demonstrates how to use function calling (tool calling)
 * with various models through OpenRouter's API.
 */

import OpenAI from 'openai';

// Client setup
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Weather tool definition
const weatherTool = {
  type: 'function' as const,
  function: {
    name: 'get_current_weather',
    description: 'Get the current weather in a given location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA',
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature unit',
        },
      },
      required: ['location'],
    },
  },
};

// Calculator tool definition
const calculatorTool = {
  type: 'function' as const,
  function: {
    name: 'calculate',
    description: 'Perform mathematical calculations',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")',
        },
      },
      required: ['expression'],
    },
  },
};

// Database query tool
const databaseTool = {
  type: 'function' as const,
  function: {
    name: 'query_database',
    description: 'Query a database for user information',
    parameters: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Database table name',
        },
        columns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Columns to select',
        },
        conditions: {
          type: 'object',
          description: 'Where conditions for the query',
          additionalProperties: true,
        },
        limit: {
          type: 'number',
          description: 'Maximum number of records to return',
        },
      },
      required: ['table', 'columns'],
    },
  },
};

// Email tool definition
const emailTool = {
  type: 'function' as const,
  function: {
    name: 'send_email',
    description: 'Send an email to specified recipients',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'array',
          items: { type: 'string' },
          description: 'Email addresses of recipients',
        },
        subject: {
          type: 'string',
          description: 'Email subject line',
        },
        body: {
          type: 'string',
          description: 'Email body content',
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high'],
          description: 'Email priority',
        },
      },
      required: ['to', 'subject', 'body'],
    },
  },
};

// Tool implementations
const toolImplementations = {
  get_current_weather: async (args: { location: string; unit?: string }) => {
    // Mock weather API call
    console.log(`Fetching weather for ${args.location}...`);
    
    // Simulate API response
    const mockWeather = {
      location: args.location,
      temperature: args.unit === 'celsius' ? 22 : 72,
      unit: args.unit || 'fahrenheit',
      condition: 'Partly cloudy',
      humidity: 65,
      wind_speed: 10,
    };

    return JSON.stringify(mockWeather);
  },

  calculate: async (args: { expression: string }) => {
    try {
      // Simple expression evaluator (in production, use a proper math parser)
      const result = Function(`"use strict"; return (${args.expression})`)();
      return JSON.stringify({ expression: args.expression, result });
    } catch (error) {
      return JSON.stringify({ error: 'Invalid mathematical expression' });
    }
  },

  query_database: async (args: { 
    table: string; 
    columns: string[]; 
    conditions?: any; 
    limit?: number 
  }) => {
    console.log(`Querying ${args.table} table...`);
    
    // Mock database response
    const mockData = [
      { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    ];

    return JSON.stringify({
      table: args.table,
      columns: args.columns,
      data: mockData.slice(0, args.limit || mockData.length),
    });
  },

  send_email: async (args: { 
    to: string[]; 
    subject: string; 
    body: string; 
    priority?: string 
  }) => {
    console.log(`Sending email to ${args.to.join(', ')}...`);
    
    // Mock email sending
    return JSON.stringify({
      status: 'sent',
      message_id: `msg_${Date.now()}`,
      recipients: args.to,
      sent_at: new Date().toISOString(),
    });
  },
};

// Basic tool calling example
export const basicToolCalling = async (userMessage: string) => {
  const completion = await client.chat.completions.create({
    model: 'openai/gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful assistant with access to various tools.' },
      { role: 'user', content: userMessage }
    ],
    tools: [weatherTool, calculatorTool],
    tool_choice: 'auto', // Let the model decide when to use tools
  });

  const message = completion.choices[0]?.message;
  
  if (message?.tool_calls) {
    // Process tool calls
    const toolResults = [];
    
    for (const toolCall of message.tool_calls) {
      const { name, arguments: args } = toolCall.function;
      const parsedArgs = JSON.parse(args);
      
      console.log(`Calling tool: ${name} with args:`, parsedArgs);
      
      // Execute the tool
      const implementation = toolImplementations[name as keyof typeof toolImplementations];
      if (implementation) {
        const result = await implementation(parsedArgs);
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool' as const,
          name,
          content: result,
        });
      }
    }

    // Continue conversation with tool results
    const followUpCompletion = await client.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant with access to various tools.' },
        { role: 'user', content: userMessage },
        message,
        ...toolResults,
      ],
      tools: [weatherTool, calculatorTool],
    });

    return {
      initial_response: message,
      tool_calls: message.tool_calls,
      tool_results: toolResults,
      final_response: followUpCompletion.choices[0]?.message?.content,
    };
  }

  return {
    response: message?.content,
    tool_calls: null,
  };
};

// Multi-step tool calling workflow
export const multiStepWorkflow = async () => {
  const messages: any[] = [
    { role: 'system', content: 'You are a personal assistant that can help with weather, calculations, and emails.' },
    { role: 'user', content: 'What\'s the weather like in New York? If it\'s above 70°F, calculate 70 * 1.8 + 32, and if the result is greater than 100, send an email to admin@example.com about the hot weather.' }
  ];

  let conversationComplete = false;
  let steps = 0;
  const maxSteps = 5; // Prevent infinite loops

  while (!conversationComplete && steps < maxSteps) {
    steps++;
    console.log(`\n--- Step ${steps} ---`);

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-4o',
      messages,
      tools: [weatherTool, calculatorTool, emailTool],
      tool_choice: 'auto',
    });

    const message = completion.choices[0]?.message;
    if (!message) break;

    messages.push(message);

    if (message.tool_calls && message.tool_calls.length > 0) {
      // Process all tool calls
      for (const toolCall of message.tool_calls) {
        const { name, arguments: args } = toolCall.function;
        const parsedArgs = JSON.parse(args);
        
        console.log(`Executing: ${name}(${JSON.stringify(parsedArgs)})`);
        
        const implementation = toolImplementations[name as keyof typeof toolImplementations];
        if (implementation) {
          const result = await implementation(parsedArgs);
          messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name,
            content: result,
          });
        }
      }
    } else {
      // No more tool calls, conversation is complete
      conversationComplete = true;
      console.log('Final response:', message.content);
    }
  }

  return {
    steps,
    final_messages: messages,
    completed: conversationComplete,
  };
};

// Parallel tool execution
export const parallelToolExecution = async (queries: string[]) => {
  const promises = queries.map(async (query) => {
    const completion = await client.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: 'You are a helpful assistant with access to tools.' },
        { role: 'user', content: query }
      ],
      tools: [weatherTool, calculatorTool, databaseTool],
      tool_choice: 'auto',
    });

    const message = completion.choices[0]?.message;
    
    if (message?.tool_calls) {
      // Execute tools in parallel for this query
      const toolPromises = message.tool_calls.map(async (toolCall) => {
        const { name, arguments: args } = toolCall.function;
        const parsedArgs = JSON.parse(args);
        
        const implementation = toolImplementations[name as keyof typeof toolImplementations];
        if (implementation) {
          const result = await implementation(parsedArgs);
          return {
            tool_call_id: toolCall.id,
            name,
            result: JSON.parse(result),
          };
        }
        return null;
      });

      const toolResults = await Promise.all(toolPromises);
      
      return {
        query,
        tool_calls: message.tool_calls,
        tool_results: toolResults.filter(Boolean),
      };
    }

    return {
      query,
      direct_response: message?.content,
    };
  });

  return await Promise.all(promises);
};

// Tool calling with different models comparison
export const compareToolCallingModels = async (userMessage: string) => {
  const models = [
    'openai/gpt-4o',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-pro',
  ];

  const results = await Promise.allSettled(
    models.map(async (model) => {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant with access to tools.' },
            { role: 'user', content: userMessage }
          ],
          tools: [weatherTool, calculatorTool],
          tool_choice: 'auto',
        });

        const message = completion.choices[0]?.message;
        
        return {
          model,
          supports_tools: !!message?.tool_calls,
          tool_calls: message?.tool_calls || [],
          direct_response: message?.tool_calls ? null : message?.content,
          success: true,
        };
      } catch (error: any) {
        return {
          model,
          error: error.message,
          success: false,
        };
      }
    })
  );

  return results.map((result, index) => ({
    model: models[index],
    ...(result.status === 'fulfilled' ? result.value : { error: result.reason, success: false })
  }));
};

// Advanced tool calling with validation
export const validatedToolCalling = async (userMessage: string) => {
  const completion = await client.chat.completions.create({
    model: 'openai/gpt-4o',
    messages: [
      { 
        role: 'system', 
        content: 'You are a helpful assistant. Always validate tool inputs and handle errors gracefully.' 
      },
      { role: 'user', content: userMessage }
    ],
    tools: [weatherTool, calculatorTool, databaseTool, emailTool],
    tool_choice: 'auto',
  });

  const message = completion.choices[0]?.message;
  
  if (message?.tool_calls) {
    const validationResults = [];
    
    for (const toolCall of message.tool_calls) {
      const { name, arguments: args } = toolCall.function;
      
      try {
        const parsedArgs = JSON.parse(args);
        
        // Validate tool arguments
        let validation = validateToolArgs(name, parsedArgs);
        
        if (validation.valid) {
          const implementation = toolImplementations[name as keyof typeof toolImplementations];
          if (implementation) {
            const result = await implementation(parsedArgs);
            validationResults.push({
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              name,
              content: result,
            });
          }
        } else {
          validationResults.push({
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            name,
            content: JSON.stringify({
              error: 'Validation failed',
              details: validation.errors,
            }),
          });
        }
      } catch (error: any) {
        validationResults.push({
          tool_call_id: toolCall.id,
          role: 'tool' as const,
          name,
          content: JSON.stringify({
            error: 'Invalid JSON arguments',
            details: error.message,
          }),
        });
      }
    }

    return {
      tool_calls: message.tool_calls,
      validation_results: validationResults,
    };
  }

  return {
    direct_response: message?.content,
  };
};

// Tool argument validation helper
function validateToolArgs(toolName: string, args: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  switch (toolName) {
    case 'get_current_weather':
      if (!args.location || typeof args.location !== 'string') {
        errors.push('Location is required and must be a string');
      }
      if (args.unit && !['celsius', 'fahrenheit'].includes(args.unit)) {
        errors.push('Unit must be either "celsius" or "fahrenheit"');
      }
      break;

    case 'calculate':
      if (!args.expression || typeof args.expression !== 'string') {
        errors.push('Expression is required and must be a string');
      }
      break;

    case 'send_email':
      if (!args.to || !Array.isArray(args.to) || args.to.length === 0) {
        errors.push('Recipients (to) must be a non-empty array');
      }
      if (!args.subject || typeof args.subject !== 'string') {
        errors.push('Subject is required and must be a string');
      }
      if (!args.body || typeof args.body !== 'string') {
        errors.push('Body is required and must be a string');
      }
      break;

    case 'query_database':
      if (!args.table || typeof args.table !== 'string') {
        errors.push('Table name is required and must be a string');
      }
      if (!args.columns || !Array.isArray(args.columns) || args.columns.length === 0) {
        errors.push('Columns must be a non-empty array');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Example usage
export const runToolCallingExamples = async () => {
  try {
    console.log('=== Basic Tool Calling ===');
    const basicResult = await basicToolCalling('What\'s the weather in Paris and what is 15 * 24?');
    console.log('Final response:', basicResult.final_response);

    console.log('\n=== Multi-step Workflow ===');
    await multiStepWorkflow();

    console.log('\n=== Parallel Tool Execution ===');
    const parallelResults = await parallelToolExecution([
      'What\'s the weather in Tokyo?',
      'Calculate 100 * 0.85',
      'Query the users table for all names and emails'
    ]);
    console.log('Parallel results:', JSON.stringify(parallelResults, null, 2));

    console.log('\n=== Model Comparison ===');
    const modelComparison = await compareToolCallingModels('What\'s 25% of 200 and the weather in London?');
    modelComparison.forEach(result => {
      console.log(`${result.model}: ${result.success ? (result.supports_tools ? 'Supports tools' : 'No tools used') : 'Failed'}`);
    });

  } catch (error) {
    console.error('Error running tool calling examples:', error);
  }
};