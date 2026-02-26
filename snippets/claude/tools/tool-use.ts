// Claude Tool Use Examples

import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 1. Basic Tool Definition
export const calculatorTool = {
  name: 'calculator',
  description: 'Perform basic mathematical calculations',
  input_schema: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")'
      }
    },
    required: ['expression']
  }
};

// 2. File System Tool
export const fileSystemTool = {
  name: 'file_operations',
  description: 'Read, write, and manipulate files',
  input_schema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['read', 'write', 'delete', 'list'],
        description: 'The operation to perform'
      },
      path: {
        type: 'string',
        description: 'File or directory path'
      },
      content: {
        type: 'string',
        description: 'Content to write (for write operations)'
      }
    },
    required: ['operation', 'path']
  }
};

// 3. API Request Tool
export const apiRequestTool = {
  name: 'api_request',
  description: 'Make HTTP requests to external APIs',
  input_schema: {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'HTTP method'
      },
      url: {
        type: 'string',
        description: 'API endpoint URL'
      },
      headers: {
        type: 'object',
        description: 'HTTP headers'
      },
      body: {
        type: 'object',
        description: 'Request body (for POST/PUT)'
      }
    },
    required: ['method', 'url']
  }
};

// 4. Tool Implementation Functions
export class ToolImplementations {
  static async calculator(expression: string): Promise<string> {
    try {
      // Safe evaluation (in production, use a proper math parser)
      const result = Function(`"use strict"; return (${expression})`)();
      return `Result: ${result}`;
    } catch (error) {
      return `Error: Invalid expression - ${error.message}`;
    }
  }

  static async fileOperations(operation: string, path: string, content?: string): Promise<string> {
    const fs = require('fs').promises;
    
    try {
      switch (operation) {
        case 'read':
          const data = await fs.readFile(path, 'utf8');
          return `File content:\n${data}`;
        
        case 'write':
          await fs.writeFile(path, content || '');
          return `Successfully wrote to ${path}`;
        
        case 'delete':
          await fs.unlink(path);
          return `Successfully deleted ${path}`;
        
        case 'list':
          const files = await fs.readdir(path);
          return `Files in ${path}:\n${files.join('\n')}`;
        
        default:
          return `Unknown operation: ${operation}`;
      }
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  static async apiRequest(method: string, url: string, headers?: any, body?: any): Promise<string> {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.text();
      return `API Response (${response.status}):\n${data}`;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
}

// 5. Tool Use with Claude
export async function toolUseExample() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    tools: [calculatorTool, fileSystemTool, apiRequestTool],
    messages: [
      {
        role: 'user',
        content: 'I need to calculate 15 * 8 + 7, then save the result to a file called result.txt'
      }
    ]
  });

  return response;
}

// 6. Complete Tool Use Workflow
export async function completeToolWorkflow() {
  let messages = [
    {
      role: 'user' as const,
      content: 'Calculate the area of a circle with radius 5, then save it to a file'
    }
  ];

  while (true) {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      tools: [calculatorTool, fileSystemTool],
      messages: messages
    });

    messages.push({
      role: 'assistant',
      content: response.content
    });

    // Check if Claude wants to use tools
    const toolUse = response.content.find(block => block.type === 'tool_use');
    
    if (toolUse) {
      // Execute the tool
      let toolResult: string;
      
      switch (toolUse.name) {
        case 'calculator':
          toolResult = await ToolImplementations.calculator(toolUse.input.expression);
          break;
        case 'file_operations':
          toolResult = await ToolImplementations.fileOperations(
            toolUse.input.operation,
            toolUse.input.path,
            toolUse.input.content
          );
          break;
        default:
          toolResult = 'Unknown tool';
      }

      // Add tool result to conversation
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: toolResult
          }
        ]
      });
    } else {
      // No more tools to use, conversation is complete
      break;
    }
  }

  return messages;
}

// 7. Custom Code Execution Tool
export const codeExecutionTool = {
  name: 'code_execution',
  description: 'Execute code in various programming languages',
  input_schema: {
    type: 'object',
    properties: {
      language: {
        type: 'string',
        enum: ['javascript', 'python', 'bash'],
        description: 'Programming language to execute'
      },
      code: {
        type: 'string',
        description: 'Code to execute'
      }
    },
    required: ['language', 'code']
  }
};

export class CodeExecutor {
  static async execute(language: string, code: string): Promise<string> {
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      let command: string;
      let args: string[];

      switch (language) {
        case 'javascript':
          command = 'node';
          args = ['-e', code];
          break;
        case 'python':
          command = 'python3';
          args = ['-c', code];
          break;
        case 'bash':
          command = 'bash';
          args = ['-c', code];
          break;
        default:
          return reject(new Error(`Unsupported language: ${language}`));
      }

      const process = spawn(command, args);
      let output = '';
      let error = '';

      process.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      process.stderr.on('data', (data: Buffer) => {
        error += data.toString();
      });

      process.on('close', (code: number) => {
        if (code === 0) {
          resolve(output || 'Code executed successfully (no output)');
        } else {
          resolve(`Error (exit code ${code}):\n${error}`);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        process.kill();
        reject(new Error('Code execution timeout'));
      }, 10000);
    });
  }
}

// 8. Database Query Tool
export const databaseTool = {
  name: 'database_query',
  description: 'Execute database queries',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'SQL query to execute'
      },
      parameters: {
        type: 'array',
        items: { type: 'string' },
        description: 'Query parameters for prepared statements'
      }
    },
    required: ['query']
  }
};

// 9. Web Scraping Tool
export const webScrapingTool = {
  name: 'web_scraping',
  description: 'Scrape content from web pages',
  input_schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to scrape'
      },
      selector: {
        type: 'string',
        description: 'CSS selector to extract specific content'
      },
      extract_text: {
        type: 'boolean',
        description: 'Whether to extract only text content'
      }
    },
    required: ['url']
  }
};

// 10. Advanced Tool Manager
export class ToolManager {
  private tools: Map<string, any> = new Map();
  private implementations: Map<string, Function> = new Map();

  registerTool(tool: any, implementation: Function) {
    this.tools.set(tool.name, tool);
    this.implementations.set(tool.name, implementation);
  }

  async executeTool(name: string, input: any): Promise<string> {
    const implementation = this.implementations.get(name);
    if (!implementation) {
      throw new Error(`Tool ${name} not found`);
    }

    try {
      return await implementation(input);
    } catch (error) {
      return `Tool execution error: ${error.message}`;
    }
  }

  getToolDefinitions(): any[] {
    return Array.from(this.tools.values());
  }

  async handleToolUseLoop(initialPrompt: string): Promise<any[]> {
    const messages = [
      { role: 'user' as const, content: initialPrompt }
    ];

    const maxIterations = 10;
    let iteration = 0;

    while (iteration < maxIterations) {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        tools: this.getToolDefinitions(),
        messages: messages
      });

      messages.push({
        role: 'assistant',
        content: response.content
      });

      // Find tool use requests
      const toolUses = response.content.filter(block => block.type === 'tool_use');
      
      if (toolUses.length === 0) {
        break; // No more tools to execute
      }

      // Execute all tools
      const toolResults = await Promise.allSettled(
        toolUses.map(async (toolUse: any) => {
          const result = await this.executeTool(toolUse.name, toolUse.input);
          return {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result
          };
        })
      );

      // Add tool results to conversation
      messages.push({
        role: 'user',
        content: toolResults.map(result => 
          result.status === 'fulfilled' ? result.value : {
            type: 'tool_result',
            tool_use_id: 'error',
            content: `Error: ${result.reason.message}`
          }
        )
      });

      iteration++;
    }

    return messages;
  }
}

// Example usage
export async function setupToolManager() {
  const manager = new ToolManager();
  
  // Register tools
  manager.registerTool(calculatorTool, (input: any) => 
    ToolImplementations.calculator(input.expression)
  );
  
  manager.registerTool(fileSystemTool, (input: any) => 
    ToolImplementations.fileOperations(input.operation, input.path, input.content)
  );
  
  manager.registerTool(codeExecutionTool, (input: any) => 
    CodeExecutor.execute(input.language, input.code)
  );

  return manager;
}

export {
  calculatorTool,
  fileSystemTool,
  apiRequestTool,
  codeExecutionTool,
  databaseTool,
  webScrapingTool,
  ToolImplementations,
  CodeExecutor,
  ToolManager,
  toolUseExample,
  completeToolWorkflow,
  setupToolManager
};