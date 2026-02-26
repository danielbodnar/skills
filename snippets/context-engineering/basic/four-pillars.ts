/**
 * Four Pillars of Context Engineering Implementation
 * 
 * This example demonstrates the four key strategies for context engineering:
 * 1. Write Context - Save information outside context window
 * 2. Select Context - Pull relevant information into context
 * 3. Compress Context - Reduce token usage while maintaining information
 * 4. Isolate Context - Separate contexts for focused processing
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// 1. WRITE CONTEXT - External Storage
class ContextWriter {
  private scratchpadPath: string;
  private memoryPath: string;
  private statePath: string;

  constructor(workingDir: string = './context-storage') {
    this.scratchpadPath = join(workingDir, 'scratchpad.json');
    this.memoryPath = join(workingDir, 'memory.json');
    this.statePath = join(workingDir, 'state.json');
  }

  /**
   * Write to scratchpad for temporary notes
   */
  writeScratchpad(id: string, content: any): void {
    const scratchpad = this.loadScratchpad();
    scratchpad[id] = {
      content,
      timestamp: new Date().toISOString(),
      type: 'scratchpad'
    };
    writeFileSync(this.scratchpadPath, JSON.stringify(scratchpad, null, 2));
  }

  /**
   * Write to long-term memory
   */
  writeMemory(key: string, value: any, metadata?: Record<string, any>): void {
    const memory = this.loadMemory();
    memory[key] = {
      value,
      metadata,
      timestamp: new Date().toISOString(),
      type: 'memory'
    };
    writeFileSync(this.memoryPath, JSON.stringify(memory, null, 2));
  }

  /**
   * Write runtime state
   */
  writeState(stateKey: string, state: any): void {
    const allStates = this.loadState();
    allStates[stateKey] = {
      state,
      timestamp: new Date().toISOString(),
      type: 'state'
    };
    writeFileSync(this.statePath, JSON.stringify(allStates, null, 2));
  }

  private loadScratchpad(): Record<string, any> {
    return existsSync(this.scratchpadPath) 
      ? JSON.parse(readFileSync(this.scratchpadPath, 'utf-8'))
      : {};
  }

  private loadMemory(): Record<string, any> {
    return existsSync(this.memoryPath)
      ? JSON.parse(readFileSync(this.memoryPath, 'utf-8'))
      : {};
  }

  private loadState(): Record<string, any> {
    return existsSync(this.statePath)
      ? JSON.parse(readFileSync(this.statePath, 'utf-8'))
      : {};
  }
}

// 2. SELECT CONTEXT - Intelligent Retrieval
interface ContextItem {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embeddings?: number[];
  relevanceScore?: number;
}

class ContextSelector {
  private knowledgeBase: ContextItem[];
  private memoryItems: ContextItem[];
  private toolDefinitions: ContextItem[];

  constructor() {
    this.knowledgeBase = [];
    this.memoryItems = [];
    this.toolDefinitions = [];
  }

  /**
   * Add items to knowledge base
   */
  addKnowledgeItem(item: ContextItem): void {
    this.knowledgeBase.push(item);
  }

  /**
   * Add memory items
   */
  addMemoryItem(item: ContextItem): void {
    this.memoryItems.push(item);
  }

  /**
   * Add tool definitions
   */
  addToolDefinition(item: ContextItem): void {
    this.toolDefinitions.push(item);
  }

  /**
   * Select relevant context based on query
   */
  selectRelevantContext(query: string, maxItems: number = 5): ContextItem[] {
    // Combine all sources
    const allItems = [
      ...this.knowledgeBase,
      ...this.memoryItems,
      ...this.toolDefinitions
    ];

    // Simple relevance scoring (in practice, use embeddings)
    const scoredItems = allItems.map(item => ({
      ...item,
      relevanceScore: this.calculateRelevanceScore(query, item)
    }));

    // Sort by relevance and return top items
    return scoredItems
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, maxItems);
  }

  /**
   * Simple relevance scoring (replace with embedding similarity)
   */
  private calculateRelevanceScore(query: string, item: ContextItem): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const itemWords = item.content.toLowerCase().split(/\s+/);
    
    let score = 0;
    queryWords.forEach(word => {
      if (itemWords.includes(word)) {
        score += 1;
      }
    });

    return score / queryWords.length;
  }

  /**
   * Select tools based on query intent
   */
  selectTools(query: string): ContextItem[] {
    return this.selectRelevantContext(query, 3).filter(
      item => item.metadata.type === 'tool'
    );
  }

  /**
   * Select memories based on recency and relevance
   */
  selectMemories(query: string, maxAge: number = 7): ContextItem[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    return this.memoryItems
      .filter(item => {
        const itemDate = new Date(item.metadata.timestamp);
        return itemDate > cutoffDate;
      })
      .map(item => ({
        ...item,
        relevanceScore: this.calculateRelevanceScore(query, item)
      }))
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 3);
  }
}

// 3. COMPRESS CONTEXT - Token Optimization
class ContextCompressor {
  private maxTokens: number;
  
  constructor(maxTokens: number = 4096) {
    this.maxTokens = maxTokens;
  }

  /**
   * Compress context using hierarchical summarization
   */
  compressHierarchically(contexts: string[]): string {
    if (contexts.length <= 1) {
      return contexts[0] || '';
    }

    // Group contexts into chunks
    const chunks: string[][] = [];
    const chunkSize = 3;
    
    for (let i = 0; i < contexts.length; i += chunkSize) {
      chunks.push(contexts.slice(i, i + chunkSize));
    }

    // Summarize each chunk
    const summaries = chunks.map(chunk => 
      this.summarizeChunk(chunk.join('\n\n'))
    );

    // Recursively compress if still too long
    if (this.estimateTokens(summaries.join('\n\n')) > this.maxTokens) {
      return this.compressHierarchically(summaries);
    }

    return summaries.join('\n\n');
  }

  /**
   * Compress by trimming older messages
   */
  trimByAge(messages: Array<{content: string, timestamp: Date}>): string {
    // Sort by timestamp (newest first)
    const sortedMessages = messages.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    let totalTokens = 0;
    const selectedMessages: string[] = [];

    for (const message of sortedMessages) {
      const tokens = this.estimateTokens(message.content);
      if (totalTokens + tokens <= this.maxTokens) {
        selectedMessages.unshift(message.content);
        totalTokens += tokens;
      } else {
        break;
      }
    }

    return selectedMessages.join('\n\n');
  }

  /**
   * Compress by removing redundancy
   */
  removeRedundancy(contexts: string[]): string {
    const uniqueContexts = new Set<string>();
    const processedContexts: string[] = [];

    for (const context of contexts) {
      // Simple deduplication (in practice, use semantic similarity)
      const normalized = context.toLowerCase().trim();
      if (!uniqueContexts.has(normalized)) {
        uniqueContexts.add(normalized);
        processedContexts.push(context);
      }
    }

    return processedContexts.join('\n\n');
  }

  /**
   * Summarize a chunk of context
   */
  private summarizeChunk(chunk: string): string {
    // Simplified summarization (in practice, use LLM)
    const sentences = chunk.split(/[.!?]+/).filter(s => s.trim());
    const importantSentences = sentences.filter(s => 
      s.length > 20 && 
      (s.includes('important') || s.includes('key') || s.includes('must'))
    );

    return importantSentences.slice(0, 3).join('. ') + '.';
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// 4. ISOLATE CONTEXT - Context Separation
class ContextIsolator {
  private contexts: Map<string, any>;
  private activeContext: string | null;

  constructor() {
    this.contexts = new Map();
    this.activeContext = null;
  }

  /**
   * Create isolated context for specific agent
   */
  createIsolatedContext(agentId: string, config: any): void {
    this.contexts.set(agentId, {
      id: agentId,
      config,
      memory: new Map(),
      state: {},
      history: [],
      tools: [],
      timestamp: new Date()
    });
  }

  /**
   * Switch to specific context
   */
  switchToContext(agentId: string): void {
    if (this.contexts.has(agentId)) {
      this.activeContext = agentId;
    } else {
      throw new Error(`Context ${agentId} not found`);
    }
  }

  /**
   * Get current context
   */
  getCurrentContext(): any {
    if (!this.activeContext) {
      throw new Error('No active context');
    }
    return this.contexts.get(this.activeContext);
  }

  /**
   * Add information to current context
   */
  addToCurrentContext(key: string, value: any): void {
    const context = this.getCurrentContext();
    context.memory.set(key, value);
  }

  /**
   * Create sandboxed environment
   */
  createSandbox(sandboxId: string): ContextSandbox {
    return new ContextSandbox(sandboxId);
  }

  /**
   * Share context between agents (controlled)
   */
  shareContext(fromAgentId: string, toAgentId: string, keys: string[]): void {
    const fromContext = this.contexts.get(fromAgentId);
    const toContext = this.contexts.get(toAgentId);

    if (!fromContext || !toContext) {
      throw new Error('Invalid agent context');
    }

    keys.forEach(key => {
      if (fromContext.memory.has(key)) {
        toContext.memory.set(key, fromContext.memory.get(key));
      }
    });
  }

  /**
   * List all contexts
   */
  listContexts(): string[] {
    return Array.from(this.contexts.keys());
  }

  /**
   * Clean up old contexts
   */
  cleanupOldContexts(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge;
    
    for (const [agentId, context] of this.contexts) {
      if (context.timestamp.getTime() < cutoffTime) {
        this.contexts.delete(agentId);
      }
    }
  }
}

class ContextSandbox {
  private sandboxId: string;
  private isolatedData: Map<string, any>;
  private permissions: Set<string>;

  constructor(sandboxId: string) {
    this.sandboxId = sandboxId;
    this.isolatedData = new Map();
    this.permissions = new Set();
  }

  /**
   * Set data in sandbox
   */
  setData(key: string, value: any): void {
    this.isolatedData.set(key, value);
  }

  /**
   * Get data from sandbox
   */
  getData(key: string): any {
    return this.isolatedData.get(key);
  }

  /**
   * Grant permission to sandbox
   */
  grantPermission(permission: string): void {
    this.permissions.add(permission);
  }

  /**
   * Check if permission is granted
   */
  hasPermission(permission: string): boolean {
    return this.permissions.has(permission);
  }

  /**
   * Clear sandbox
   */
  clear(): void {
    this.isolatedData.clear();
    this.permissions.clear();
  }
}

// Usage Example
const writer = new ContextWriter();
const selector = new ContextSelector();
const compressor = new ContextCompressor();
const isolator = new ContextIsolator();

// 1. Write context externally
writer.writeScratchpad('task-1', {
  task: 'Implement file upload',
  progress: 'Started analysis',
  notes: 'User prefers TypeScript with Zod validation'
});

// 2. Select relevant context
selector.addKnowledgeItem({
  id: 'kb-1',
  content: 'File upload best practices with TypeScript',
  metadata: { type: 'knowledge', topic: 'file-upload' }
});

const relevantContext = selector.selectRelevantContext('file upload TypeScript');

// 3. Compress context
const compressedContext = compressor.compressHierarchically([
  'Long context 1...',
  'Long context 2...',
  'Long context 3...'
]);

// 4. Isolate context
isolator.createIsolatedContext('agent-1', { role: 'file-upload-specialist' });
isolator.switchToContext('agent-1');
isolator.addToCurrentContext('currentTask', 'file upload implementation');

export { 
  ContextWriter, 
  ContextSelector, 
  ContextCompressor, 
  ContextIsolator,
  ContextSandbox 
};