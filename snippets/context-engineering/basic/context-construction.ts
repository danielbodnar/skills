/**
 * Basic Context Construction Pattern
 * 
 * This example demonstrates the fundamental approach to building context
 * for LLM agents using a structured, systematic method.
 */

interface ContextElement {
  type: 'system' | 'user' | 'memory' | 'tool' | 'knowledge' | 'state';
  content: string;
  priority: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ContextWindow {
  maxTokens: number;
  currentTokens: number;
  elements: ContextElement[];
}

class BasicContextManager {
  private context: ContextWindow;
  private tokenCounter: (text: string) => number;

  constructor(maxTokens: number = 4096) {
    this.context = {
      maxTokens,
      currentTokens: 0,
      elements: []
    };
    this.tokenCounter = this.estimateTokens;
  }

  /**
   * Add system instructions to context
   */
  addSystemPrompt(instructions: string, priority: number = 10): void {
    this.addContextElement({
      type: 'system',
      content: instructions,
      priority,
      timestamp: new Date()
    });
  }

  /**
   * Add user input to context
   */
  addUserInput(input: string, priority: number = 9): void {
    this.addContextElement({
      type: 'user',
      content: input,
      priority,
      timestamp: new Date()
    });
  }

  /**
   * Add memory elements to context
   */
  addMemory(memory: string, priority: number = 5): void {
    this.addContextElement({
      type: 'memory',
      content: memory,
      priority,
      timestamp: new Date()
    });
  }

  /**
   * Add tool definitions and results
   */
  addToolContext(toolInfo: string, priority: number = 7): void {
    this.addContextElement({
      type: 'tool',
      content: toolInfo,
      priority,
      timestamp: new Date()
    });
  }

  /**
   * Add knowledge base information
   */
  addKnowledge(knowledge: string, priority: number = 6): void {
    this.addContextElement({
      type: 'knowledge',
      content: knowledge,
      priority,
      timestamp: new Date()
    });
  }

  /**
   * Add runtime state information
   */
  addState(state: string, priority: number = 4): void {
    this.addContextElement({
      type: 'state',
      content: state,
      priority,
      timestamp: new Date()
    });
  }

  /**
   * Add context element with token management
   */
  private addContextElement(element: ContextElement): void {
    const tokens = this.tokenCounter(element.content);
    
    if (this.context.currentTokens + tokens > this.context.maxTokens) {
      this.compressContext();
    }

    this.context.elements.push(element);
    this.context.currentTokens += tokens;
    this.sortContextByPriority();
  }

  /**
   * Compress context when approaching token limits
   */
  private compressContext(): void {
    // Sort by priority and timestamp
    this.context.elements.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Remove lowest priority elements
    while (this.context.currentTokens > this.context.maxTokens * 0.8) {
      const removed = this.context.elements.pop();
      if (removed) {
        this.context.currentTokens -= this.tokenCounter(removed.content);
      }
    }
  }

  /**
   * Sort context elements by priority
   */
  private sortContextByPriority(): void {
    this.context.elements.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Estimate token count (simplified approximation)
   */
  private estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Build final context string
   */
  buildContext(): string {
    return this.context.elements
      .map(element => {
        switch (element.type) {
          case 'system':
            return `<system>\n${element.content}\n</system>`;
          case 'user':
            return `<user>\n${element.content}\n</user>`;
          case 'memory':
            return `<memory>\n${element.content}\n</memory>`;
          case 'tool':
            return `<tools>\n${element.content}\n</tools>`;
          case 'knowledge':
            return `<knowledge>\n${element.content}\n</knowledge>`;
          case 'state':
            return `<state>\n${element.content}\n</state>`;
          default:
            return element.content;
        }
      })
      .join('\n\n');
  }

  /**
   * Get context statistics
   */
  getStats(): {
    totalElements: number;
    currentTokens: number;
    maxTokens: number;
    utilizationPercentage: number;
    elementsByType: Record<string, number>;
  } {
    const elementsByType: Record<string, number> = {};
    
    this.context.elements.forEach(element => {
      elementsByType[element.type] = (elementsByType[element.type] || 0) + 1;
    });

    return {
      totalElements: this.context.elements.length,
      currentTokens: this.context.currentTokens,
      maxTokens: this.context.maxTokens,
      utilizationPercentage: (this.context.currentTokens / this.context.maxTokens) * 100,
      elementsByType
    };
  }

  /**
   * Clear context
   */
  clear(): void {
    this.context.elements = [];
    this.context.currentTokens = 0;
  }
}

// Usage Example
const contextManager = new BasicContextManager(8192);

// Add system instructions
contextManager.addSystemPrompt(`
You are a helpful AI assistant focused on software development.
Always provide accurate, well-documented code examples.
Consider security and performance implications.
`, 10);

// Add user request
contextManager.addUserInput(
  "Help me implement a file upload feature with TypeScript and validation",
  9
);

// Add relevant memory
contextManager.addMemory(`
Previous conversation covered:
- User prefers TypeScript with strict mode
- Uses Bun runtime and Hono framework
- Follows functional programming patterns
`, 8);

// Add tool context
contextManager.addToolContext(`
Available tools:
- File system operations
- Code generation
- Validation libraries (Zod)
- Testing frameworks (Vitest)
`, 7);

// Add knowledge base information
contextManager.addKnowledge(`
File upload best practices:
- Validate file types and sizes
- Use streaming for large files
- Implement proper error handling
- Consider security implications
`, 6);

// Build final context
const finalContext = contextManager.buildContext();
console.log('Final Context:', finalContext);

// Get context statistics
const stats = contextManager.getStats();
console.log('Context Stats:', stats);

export { BasicContextManager, ContextElement, ContextWindow };