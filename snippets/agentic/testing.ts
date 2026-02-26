// Testing Patterns for Agentic SDKs

import { createAISDKTools } from '@agentic/ai-sdk'
import { createLangChainTools } from '@agentic/langchain'
import { AgenticToolClient } from '@agentic/platform-tool-client'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

// ==========================================
// Mock Tool Creation
// ==========================================

export const createMockTool = (identifier: string, responses: any = {}) => {
  return {
    identifier,
    execute: vi.fn().mockImplementation(async (input: any) => {
      const key = JSON.stringify(input)
      return responses[key] || { result: 'mock response' }
    }),
    metadata: {
      name: `mock-${identifier}`,
      description: `Mock tool for ${identifier}`,
      parameters: {}
    }
  }
}

// ==========================================
// Unit Tests for Tool Integration
// ==========================================

describe('Agentic Tool Integration', () => {
  let mockSearchTool: any
  let mockCalculatorTool: any

  beforeEach(() => {
    mockSearchTool = createMockTool('@agentic/search', {
      '{"query":"TypeScript"}': { 
        results: [
          { title: 'TypeScript Official', url: 'typescript.org' }
        ] 
      }
    })
    
    mockCalculatorTool = createMockTool('@agentic/calculator', {
      '{"expression":"2+2"}': { result: 4 }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should convert tool to AI SDK format', () => {
    const aiSDKTools = createAISDKTools(mockSearchTool)
    
    expect(aiSDKTools).toBeDefined()
    expect(Array.isArray(aiSDKTools)).toBe(true)
    expect(aiSDKTools.length).toBeGreaterThan(0)
  })

  it('should convert tool to LangChain format', () => {
    const langChainTools = createLangChainTools(mockSearchTool)
    
    expect(langChainTools).toBeDefined()
    expect(Array.isArray(langChainTools)).toBe(true)
    expect(langChainTools.length).toBeGreaterThan(0)
  })

  it('should execute mock tool correctly', async () => {
    const result = await mockSearchTool.execute({ query: 'TypeScript' })
    
    expect(mockSearchTool.execute).toHaveBeenCalledWith({ query: 'TypeScript' })
    expect(result.results).toBeDefined()
    expect(result.results[0].title).toBe('TypeScript Official')
  })
})

// ==========================================
// Integration Test Helpers
// ==========================================

export class TestToolRegistry {
  private tools = new Map<string, any>()

  registerMock(identifier: string, responses: any = {}) {
    const mockTool = createMockTool(identifier, responses)
    this.tools.set(identifier, mockTool)
    return mockTool
  }

  get(identifier: string) {
    return this.tools.get(identifier)
  }

  async loadTool(identifier: string) {
    // In tests, return mock; in production, load real tool
    if (process.env.NODE_ENV === 'test') {
      return this.get(identifier) || this.registerMock(identifier)
    }
    return await AgenticToolClient.fromIdentifier(identifier)
  }
}

// ==========================================
// E2E Test Example
// ==========================================

export const e2eTestExample = async () => {
  // Only run in test environment
  if (process.env.NODE_ENV !== 'test') {
    console.log('E2E tests should only run in test environment')
    return
  }

  const registry = new TestToolRegistry()
  
  // Register mock tools with expected responses
  const searchTool = registry.registerMock('@agentic/search', {
    '{"query":"weather Tokyo"}': {
      results: [
        { 
          title: 'Tokyo Weather',
          description: 'Current temperature: 22°C, Sunny'
        }
      ]
    }
  })

  // Test the tool execution
  const tools = createAISDKTools(searchTool)
  
  // Mock OpenAI for testing
  const mockOpenAI = {
    generateText: vi.fn().mockResolvedValue({
      text: 'The weather in Tokyo is 22°C and sunny.',
      toolCalls: [
        { tool: 'search', args: { query: 'weather Tokyo' } }
      ]
    })
  }

  // Verify tool was called
  expect(searchTool.execute).not.toHaveBeenCalled()
  
  // Simulate tool call
  await searchTool.execute({ query: 'weather Tokyo' })
  
  expect(searchTool.execute).toHaveBeenCalledWith({ query: 'weather Tokyo' })
}

// ==========================================
// Performance Testing
// ==========================================

export const performanceTest = async () => {
  const iterations = 100
  const results: number[] = []

  const mockTool = createMockTool('@agentic/search', {
    default: { result: 'performance test response' }
  })

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    
    const tools = createAISDKTools(mockTool)
    await mockTool.execute({ query: `test ${i}` })
    
    const duration = performance.now() - start
    results.push(duration)
  }

  const avg = results.reduce((a, b) => a + b, 0) / results.length
  const max = Math.max(...results)
  const min = Math.min(...results)

  console.log(`Performance Test Results (${iterations} iterations):`)
  console.log(`  Average: ${avg.toFixed(2)}ms`)
  console.log(`  Min: ${min.toFixed(2)}ms`)
  console.log(`  Max: ${max.toFixed(2)}ms`)

  return { avg, min, max }
}

// ==========================================
// Error Scenario Testing
// ==========================================

export const errorScenarioTests = () => {
  describe('Error Handling', () => {
    it('should handle tool execution failure', async () => {
      const failingTool = {
        identifier: '@agentic/failing',
        execute: vi.fn().mockRejectedValue(new Error('Tool execution failed')),
        metadata: { name: 'failing-tool' }
      }

      await expect(failingTool.execute({})).rejects.toThrow('Tool execution failed')
      expect(failingTool.execute).toHaveBeenCalled()
    })

    it('should handle invalid tool identifier', async () => {
      try {
        await AgenticToolClient.fromIdentifier('@invalid/tool')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle network timeout', async () => {
      const timeoutTool = {
        identifier: '@agentic/timeout',
        execute: vi.fn().mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
        )
      }

      await expect(timeoutTool.execute({})).rejects.toThrow('Timeout')
    })
  })
}

// ==========================================
// Snapshot Testing
// ==========================================

export const snapshotTest = () => {
  describe('Tool Response Snapshots', () => {
    it('should match expected search response structure', () => {
      const mockResponse = {
        results: [
          {
            title: 'Example Result',
            url: 'https://example.com',
            description: 'An example search result',
            relevance: 0.95
          }
        ],
        metadata: {
          query: 'test query',
          timestamp: '2024-01-01T00:00:00Z',
          totalResults: 1
        }
      }

      expect(mockResponse).toMatchSnapshot()
    })

    it('should match expected calculator response structure', () => {
      const mockResponse = {
        expression: '2 + 2',
        result: 4,
        steps: [
          { operation: 'add', operands: [2, 2], result: 4 }
        ]
      }

      expect(mockResponse).toMatchSnapshot()
    })
  })
}

// ==========================================
// Test Utilities
// ==========================================

export const testUtils = {
  // Wait for async operations
  waitFor: async (condition: () => boolean, timeout = 5000) => {
    const start = Date.now()
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (!condition()) {
      throw new Error('Timeout waiting for condition')
    }
  },

  // Create test environment
  createTestEnv: () => ({
    OPENAI_API_KEY: 'test-key',
    AGENTIC_API_KEY: 'test-agentic-key',
    NODE_ENV: 'test'
  }),

  // Mock API responses
  mockAPIResponse: (status: number, data: any) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data)
  }),

  // Assertion helpers
  assertToolCall: (tool: any, expectedCalls: number) => {
    expect(tool.execute).toHaveBeenCalledTimes(expectedCalls)
  },

  assertToolInput: (tool: any, expectedInput: any) => {
    expect(tool.execute).toHaveBeenCalledWith(
      expect.objectContaining(expectedInput)
    )
  }
}

// ==========================================
// Test Configuration
// ==========================================

export const vitestConfig = {
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', '*.config.ts']
    },
    testTimeout: 10000,
    hookTimeout: 10000
  }
}