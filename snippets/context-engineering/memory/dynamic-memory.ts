/**
 * Dynamic Memory Management for Context Engineering
 * 
 * This example demonstrates advanced memory management patterns
 * for AI agents with context-aware storage and retrieval.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

interface MemoryItem {
  id: string;
  content: string;
  type: 'fact' | 'procedure' | 'episodic' | 'semantic' | 'working';
  importance: number;
  timestamp: Date;
  lastAccessed: Date;
  accessCount: number;
  tags: string[];
  metadata: Record<string, any>;
  embedding?: number[];
  connections: string[];
}

interface MemoryQuery {
  content?: string;
  type?: MemoryItem['type'];
  tags?: string[];
  minImportance?: number;
  maxAge?: number;
  limit?: number;
  includeConnections?: boolean;
}

interface MemoryContext {
  sessionId: string;
  workingMemory: MemoryItem[];
  activeContext: string[];
  priorities: Record<string, number>;
  comprehensionLevel: number;
  focus: string[];
}

class DynamicMemoryManager {
  private storageDir: string;
  private memoryIndex: Map<string, MemoryItem>;
  private context: MemoryContext;
  private maxWorkingMemory: number;
  private compressionThreshold: number;

  constructor(storageDir: string, sessionId: string) {
    this.storageDir = storageDir;
    this.maxWorkingMemory = 20;
    this.compressionThreshold = 100;
    
    this.context = {
      sessionId,
      workingMemory: [],
      activeContext: [],
      priorities: {},
      comprehensionLevel: 0.5,
      focus: []
    };
    
    this.memoryIndex = new Map();
    this.initializeStorage();
    this.loadMemoryIndex();
  }

  /**
   * Store information in memory with context awareness
   */
  remember(content: string, type: MemoryItem['type'], options: {
    importance?: number;
    tags?: string[];
    metadata?: Record<string, any>;
    connections?: string[];
  } = {}): string {
    const id = this.generateId(content);
    const now = new Date();
    
    const memoryItem: MemoryItem = {
      id,
      content,
      type,
      importance: options.importance || this.calculateImportance(content, type),
      timestamp: now,
      lastAccessed: now,
      accessCount: 1,
      tags: options.tags || this.extractTags(content),
      metadata: options.metadata || {},
      connections: options.connections || [],
      embedding: this.generateEmbedding(content)
    };

    // Store in index
    this.memoryIndex.set(id, memoryItem);
    
    // Add to working memory if important
    if (memoryItem.importance > 0.6) {
      this.addToWorkingMemory(memoryItem);
    }
    
    // Create connections
    this.createConnections(memoryItem);
    
    // Persist to storage
    this.persistMemoryItem(memoryItem);
    
    return id;
  }

  /**
   * Retrieve information from memory with context filtering
   */
  recall(query: MemoryQuery): MemoryItem[] {
    let results = Array.from(this.memoryIndex.values());
    
    // Filter by content similarity
    if (query.content) {
      results = results.filter(item => 
        this.calculateSimilarity(query.content!, item.content) > 0.3
      );
    }
    
    // Filter by type
    if (query.type) {
      results = results.filter(item => item.type === query.type);
    }
    
    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(item => 
        query.tags!.some(tag => item.tags.includes(tag))
      );
    }
    
    // Filter by importance
    if (query.minImportance) {
      results = results.filter(item => item.importance >= query.minImportance!);
    }
    
    // Filter by age
    if (query.maxAge) {
      const cutoff = new Date(Date.now() - query.maxAge * 24 * 60 * 60 * 1000);
      results = results.filter(item => item.timestamp > cutoff);
    }
    
    // Sort by relevance
    results = this.sortByRelevance(results, query);
    
    // Update access statistics
    results.forEach(item => {
      item.lastAccessed = new Date();
      item.accessCount++;
    });
    
    // Limit results
    if (query.limit) {
      results = results.slice(0, query.limit);
    }
    
    // Include connections if requested
    if (query.includeConnections) {
      results = this.expandWithConnections(results);
    }
    
    return results;
  }

  /**
   * Forget information based on criteria
   */
  forget(criteria: {
    olderThan?: number;
    lessImportantThan?: number;
    withTags?: string[];
    withType?: MemoryItem['type'];
  }): number {
    let toForget: string[] = [];
    
    for (const [id, item] of this.memoryIndex) {
      let shouldForget = false;
      
      if (criteria.olderThan) {
        const cutoff = new Date(Date.now() - criteria.olderThan * 24 * 60 * 60 * 1000);
        shouldForget = item.timestamp < cutoff;
      }
      
      if (criteria.lessImportantThan) {
        shouldForget = shouldForget || item.importance < criteria.lessImportantThan;
      }
      
      if (criteria.withTags) {
        shouldForget = shouldForget || criteria.withTags.some(tag => item.tags.includes(tag));
      }
      
      if (criteria.withType) {
        shouldForget = shouldForget || item.type === criteria.withType;
      }
      
      if (shouldForget) {
        toForget.push(id);
      }
    }
    
    // Remove from memory
    toForget.forEach(id => {
      this.memoryIndex.delete(id);
      this.removeFromWorkingMemory(id);
    });
    
    return toForget.length;
  }

  /**
   * Compress memory by consolidating similar items
   */
  compressMemory(): number {
    const clusters = this.clusterSimilarMemories();
    let compressed = 0;
    
    for (const cluster of clusters) {
      if (cluster.length > 1) {
        const consolidated = this.consolidateMemories(cluster);
        
        // Remove original items
        cluster.forEach(item => this.memoryIndex.delete(item.id));
        
        // Add consolidated item
        this.memoryIndex.set(consolidated.id, consolidated);
        compressed += cluster.length - 1;
      }
    }
    
    return compressed;
  }

  /**
   * Update working memory with current context
   */
  updateWorkingMemory(contextItems: string[]): void {
    this.context.activeContext = contextItems;
    
    // Retrieve relevant memories for current context
    const relevantMemories = this.recall({
      content: contextItems.join(' '),
      limit: this.maxWorkingMemory,
      minImportance: 0.4
    });
    
    // Clear and rebuild working memory
    this.context.workingMemory = relevantMemories;
    
    // Update priorities based on context
    this.updatePriorities(contextItems);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    totalMemories: number;
    memoryByType: Record<string, number>;
    workingMemorySize: number;
    averageImportance: number;
    oldestMemory: Date | null;
    newestMemory: Date | null;
  } {
    const memories = Array.from(this.memoryIndex.values());
    
    const memoryByType: Record<string, number> = {};
    let totalImportance = 0;
    let oldestMemory: Date | null = null;
    let newestMemory: Date | null = null;
    
    memories.forEach(memory => {
      memoryByType[memory.type] = (memoryByType[memory.type] || 0) + 1;
      totalImportance += memory.importance;
      
      if (!oldestMemory || memory.timestamp < oldestMemory) {
        oldestMemory = memory.timestamp;
      }
      
      if (!newestMemory || memory.timestamp > newestMemory) {
        newestMemory = memory.timestamp;
      }
    });
    
    return {
      totalMemories: memories.length,
      memoryByType,
      workingMemorySize: this.context.workingMemory.length,
      averageImportance: totalImportance / memories.length || 0,
      oldestMemory,
      newestMemory
    };
  }

  /**
   * Generate memory visualization
   */
  generateMemoryMap(): string {
    const stats = this.getMemoryStats();
    const workingMemory = this.context.workingMemory;
    const recentMemories = this.recall({ limit: 10 });
    
    return `# Memory Map

## Statistics
- Total Memories: ${stats.totalMemories}
- Working Memory: ${stats.workingMemorySize}/${this.maxWorkingMemory}
- Average Importance: ${stats.averageImportance.toFixed(2)}

## Memory by Type
${Object.entries(stats.memoryByType).map(([type, count]) => 
  `- ${type}: ${count}`
).join('\n')}

## Working Memory (Active Context)
${workingMemory.map(item => 
  `- ${item.type}: ${item.content.substring(0, 50)}...`
).join('\n')}

## Recent Memories
${recentMemories.map(item => 
  `- ${item.timestamp.toISOString()}: ${item.content.substring(0, 50)}...`
).join('\n')}

## Current Focus
${this.context.focus.map(focus => `- ${focus}`).join('\n')}
`;
  }

  /**
   * Save memory state to file
   */
  saveMemoryState(): void {
    const statePath = join(this.storageDir, 'memory-state.json');
    const state = {
      context: this.context,
      index: Array.from(this.memoryIndex.entries()),
      timestamp: new Date().toISOString()
    };
    
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  }

  /**
   * Load memory state from file
   */
  loadMemoryState(): void {
    const statePath = join(this.storageDir, 'memory-state.json');
    
    if (existsSync(statePath)) {
      const state = JSON.parse(readFileSync(statePath, 'utf-8'));
      this.context = state.context;
      this.memoryIndex = new Map(state.index);
    }
  }

  /**
   * Private helper methods
   */
  private generateId(content: string): string {
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  private calculateImportance(content: string, type: MemoryItem['type']): number {
    let importance = 0.5;
    
    // Type-based importance
    const typeImportance = {
      'fact': 0.7,
      'procedure': 0.8,
      'episodic': 0.6,
      'semantic': 0.7,
      'working': 0.9
    };
    
    importance = typeImportance[type] || 0.5;
    
    // Content-based importance
    const importantWords = ['important', 'critical', 'key', 'must', 'always', 'never'];
    const hasImportantWords = importantWords.some(word => 
      content.toLowerCase().includes(word)
    );
    
    if (hasImportantWords) {
      importance += 0.2;
    }
    
    // Length-based importance
    if (content.length > 500) {
      importance += 0.1;
    }
    
    return Math.min(1.0, Math.max(0.0, importance));
  }

  private extractTags(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return words
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 5);
  }

  private generateEmbedding(content: string): number[] {
    // Simplified embedding generation (in practice, use real embeddings)
    const words = content.toLowerCase().split(/\s+/);
    const embedding = new Array(100).fill(0);
    
    words.forEach((word, index) => {
      const hash = createHash('sha256').update(word).digest();
      for (let i = 0; i < 100; i++) {
        embedding[i] += hash[i % hash.length] / 255;
      }
    });
    
    return embedding.map(x => x / words.length);
  }

  private calculateSimilarity(content1: string, content2: string): number {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private addToWorkingMemory(item: MemoryItem): void {
    // Remove oldest item if at capacity
    if (this.context.workingMemory.length >= this.maxWorkingMemory) {
      this.context.workingMemory.shift();
    }
    
    // Add new item
    this.context.workingMemory.push(item);
  }

  private removeFromWorkingMemory(id: string): void {
    this.context.workingMemory = this.context.workingMemory.filter(item => item.id !== id);
  }

  private createConnections(item: MemoryItem): void {
    // Find similar items to connect
    const similar = this.recall({
      content: item.content,
      limit: 5
    }).filter(other => other.id !== item.id);
    
    // Create bidirectional connections
    similar.forEach(other => {
      if (!item.connections.includes(other.id)) {
        item.connections.push(other.id);
      }
      if (!other.connections.includes(item.id)) {
        other.connections.push(item.id);
      }
    });
  }

  private sortByRelevance(items: MemoryItem[], query: MemoryQuery): MemoryItem[] {
    return items.sort((a, b) => {
      let scoreA = a.importance;
      let scoreB = b.importance;
      
      // Boost recent items
      const ageA = (Date.now() - a.timestamp.getTime()) / (24 * 60 * 60 * 1000);
      const ageB = (Date.now() - b.timestamp.getTime()) / (24 * 60 * 60 * 1000);
      
      scoreA += Math.max(0, 1 - ageA / 30); // Boost items from last 30 days
      scoreB += Math.max(0, 1 - ageB / 30);
      
      // Boost frequently accessed items
      scoreA += Math.min(0.5, a.accessCount / 10);
      scoreB += Math.min(0.5, b.accessCount / 10);
      
      return scoreB - scoreA;
    });
  }

  private expandWithConnections(items: MemoryItem[]): MemoryItem[] {
    const expanded = new Set(items);
    
    items.forEach(item => {
      item.connections.forEach(connectionId => {
        const connected = this.memoryIndex.get(connectionId);
        if (connected) {
          expanded.add(connected);
        }
      });
    });
    
    return Array.from(expanded);
  }

  private clusterSimilarMemories(): MemoryItem[][] {
    const items = Array.from(this.memoryIndex.values());
    const clusters: MemoryItem[][] = [];
    const visited = new Set<string>();
    
    items.forEach(item => {
      if (!visited.has(item.id)) {
        const cluster = [item];
        visited.add(item.id);
        
        items.forEach(other => {
          if (!visited.has(other.id) && 
              this.calculateSimilarity(item.content, other.content) > 0.8) {
            cluster.push(other);
            visited.add(other.id);
          }
        });
        
        clusters.push(cluster);
      }
    });
    
    return clusters;
  }

  private consolidateMemories(cluster: MemoryItem[]): MemoryItem {
    const consolidated = cluster.reduce((acc, item) => {
      return {
        ...acc,
        content: acc.content + '\n' + item.content,
        importance: Math.max(acc.importance, item.importance),
        tags: [...new Set([...acc.tags, ...item.tags])],
        connections: [...new Set([...acc.connections, ...item.connections])],
        accessCount: acc.accessCount + item.accessCount
      };
    });
    
    return {
      ...consolidated,
      id: this.generateId(consolidated.content),
      timestamp: new Date(),
      lastAccessed: new Date()
    };
  }

  private updatePriorities(contextItems: string[]): void {
    // Reset priorities
    this.context.priorities = {};
    
    // Set priorities based on context
    contextItems.forEach((item, index) => {
      this.context.priorities[item] = 1.0 - (index * 0.1);
    });
  }

  private initializeStorage(): void {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private loadMemoryIndex(): void {
    this.loadMemoryState();
  }

  private persistMemoryItem(item: MemoryItem): void {
    const itemPath = join(this.storageDir, `${item.id}.json`);
    writeFileSync(itemPath, JSON.stringify(item, null, 2));
  }
}

// Usage Example
const memoryManager = new DynamicMemoryManager('./memory-storage', 'session-1');

// Store different types of memories
memoryManager.remember('User prefers TypeScript with strict mode', 'fact', {
  importance: 0.8,
  tags: ['typescript', 'preference', 'strictmode']
});

memoryManager.remember('To implement file upload: 1. Validate file type 2. Check file size 3. Store securely', 'procedure', {
  importance: 0.9,
  tags: ['file-upload', 'procedure', 'security']
});

memoryManager.remember('Previous conversation was about implementing authentication', 'episodic', {
  importance: 0.6,
  tags: ['authentication', 'conversation', 'previous']
});

// Update working memory with current context
memoryManager.updateWorkingMemory(['file-upload', 'typescript', 'security']);

// Recall relevant information
const relevantMemories = memoryManager.recall({
  content: 'file upload implementation',
  minImportance: 0.5,
  limit: 5
});

// Generate memory map
const memoryMap = memoryManager.generateMemoryMap();
console.log(memoryMap);

// Save state
memoryManager.saveMemoryState();

export { DynamicMemoryManager, MemoryItem, MemoryQuery, MemoryContext };