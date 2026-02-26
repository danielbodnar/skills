// API Examples for Agentic SDKs

import { createAISDKTools } from '@agentic/ai-sdk'
import { createLangChainTools } from '@agentic/langchain'
import { AgenticToolClient } from '@agentic/platform-tool-client'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText, generateObject } from 'ai'
import { z } from 'zod'
import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { HumanMessage, AIMessage } from '@langchain/core/messages'

// ==========================================
// AI SDK API Examples
// ==========================================

// Generate structured data with tools
export const generateStructuredData = async () => {
  const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
  const openai = createOpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict' 
  })

  // Define the schema for structured output
  const CompanyInfoSchema = z.object({
    name: z.string(),
    founded: z.number(),
    headquarters: z.string(),
    ceo: z.string(),
    employees: z.number().optional(),
    description: z.string()
  })

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    tools: createAISDKTools(searchTool),
    schema: CompanyInfoSchema,
    prompt: 'Get information about OpenAI company'
  })

  console.log('Structured data:', result.object)
  return result.object
}

// Multi-turn conversation with tools
export const multiTurnConversation = async () => {
  const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
  const openai = createOpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict' 
  })

  const messages = [
    { role: 'system' as const, content: 'You are a helpful assistant.' },
    { role: 'user' as const, content: 'What is TypeScript?' }
  ]

  // First turn
  const result1 = await generateText({
    model: openai('gpt-4o-mini'),
    tools: createAISDKTools(searchTool),
    messages,
    temperature: 0
  })

  // Add response to conversation
  messages.push({ role: 'assistant' as const, content: result1.text })
  messages.push({ role: 'user' as const, content: 'What are its main benefits?' })

  // Second turn
  const result2 = await generateText({
    model: openai('gpt-4o-mini'),
    tools: createAISDKTools(searchTool),
    messages,
    temperature: 0
  })

  return { 
    firstResponse: result1.text, 
    secondResponse: result2.text 
  }
}

// Parallel tool calls
export const parallelToolCalls = async () => {
  const [searchTool, calculatorTool] = await Promise.all([
    AgenticToolClient.fromIdentifier('@agentic/search'),
    AgenticToolClient.fromIdentifier('@agentic/calculator')
  ])

  const openai = createOpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict' 
  })

  const tools = [
    ...createAISDKTools(searchTool),
    ...createAISDKTools(calculatorTool)
  ]

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    tools,
    toolChoice: 'required',
    prompt: 'What is the population of Tokyo and what is 15% of that number?',
    temperature: 0
  })

  return result
}

// ==========================================
// LangChain API Examples
// ==========================================

// Agent with memory
export const agentWithMemory = async () => {
  const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
  const tools = createLangChainTools(searchTool)
  
  const llm = new ChatOpenAI({ 
    model: 'gpt-4o-mini', 
    temperature: 0 
  })

  // Create prompt with memory placeholder
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a helpful assistant.'],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad')
  ])

  const agent = createToolCallingAgent({ llm, tools, prompt })
  const agentExecutor = new AgentExecutor({ agent, tools })

  // Conversation history
  const chatHistory = [
    new HumanMessage('My name is Alice'),
    new AIMessage('Nice to meet you, Alice!')
  ]

  const result = await agentExecutor.invoke({
    input: 'What did I just tell you my name was?',
    chat_history: chatHistory
  })

  return result
}

// Sequential tool chain
export const sequentialToolChain = async () => {
  const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
  const calculatorTool = await AgenticToolClient.fromIdentifier('@agentic/calculator')
  
  const searchTools = createLangChainTools(searchTool)
  const calcTools = createLangChainTools(calculatorTool)
  const allTools = [...searchTools, ...calcTools]
  
  const llm = new ChatOpenAI({ 
    model: 'gpt-4o-mini', 
    temperature: 0 
  })

  const agent = createToolCallingAgent({ llm, tools: allTools })
  const agentExecutor = new AgentExecutor({ 
    agent, 
    tools: allTools,
    returnIntermediateSteps: true
  })

  const result = await agentExecutor.invoke({
    input: 'Find the current price of Bitcoin, then calculate how much $1000 worth would be'
  })

  console.log('Final answer:', result.output)
  console.log('Steps taken:', result.intermediateSteps)
  
  return result
}

// Custom tool wrapper
export const customToolWrapper = async () => {
  const baseTool = await AgenticToolClient.fromIdentifier('@agentic/search')
  
  // Wrap the tool with custom logic
  const enhancedTool = {
    ...baseTool,
    execute: async (input: any) => {
      console.log('Tool input:', input)
      const startTime = Date.now()
      
      const result = await baseTool.execute(input)
      
      const duration = Date.now() - startTime
      console.log(`Tool execution took ${duration}ms`)
      
      return result
    }
  }

  const tools = createLangChainTools(enhancedTool)
  return tools
}

// ==========================================
// Advanced Tool Patterns
// ==========================================

// Conditional tool selection
export const conditionalToolSelection = async () => {
  const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
  const weatherTool = await AgenticToolClient.fromIdentifier('@agentic/weather')
  const calculatorTool = await AgenticToolClient.fromIdentifier('@agentic/calculator')
  
  const openai = createOpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict' 
  })

  // Function to select tools based on query
  const selectTools = (query: string) => {
    const tools = []
    
    if (query.toLowerCase().includes('weather')) {
      tools.push(...createAISDKTools(weatherTool))
    }
    if (query.toLowerCase().includes('calculate') || query.toLowerCase().includes('math')) {
      tools.push(...createAISDKTools(calculatorTool))
    }
    if (tools.length === 0) {
      // Default to search if no specific tool matches
      tools.push(...createAISDKTools(searchTool))
    }
    
    return tools
  }

  const query = 'What is the weather in Tokyo?'
  const selectedTools = selectTools(query)

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    tools: selectedTools,
    prompt: query,
    temperature: 0
  })

  return result
}

// Tool result transformation
export const transformToolResults = async () => {
  const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
  
  // Create a transformer function
  const transformSearchResults = (results: any) => {
    if (Array.isArray(results)) {
      return results.map(item => ({
        title: item.title || 'Untitled',
        summary: item.description || item.snippet || 'No description',
        url: item.link || item.url || '#',
        relevance: item.score || 1.0
      }))
    }
    return results
  }

  // Wrap tool with transformation
  const transformedTool = {
    ...searchTool,
    execute: async (input: any) => {
      const rawResults = await searchTool.execute(input)
      return transformSearchResults(rawResults)
    }
  }

  const tools = createAISDKTools(transformedTool)
  
  const openai = createOpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict' 
  })

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    tools,
    prompt: 'Search for information about Effect-TS',
    temperature: 0
  })

  return result
}

// Error handling with fallbacks
export const toolErrorHandling = async () => {
  const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
  const openai = createOpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict' 
  })

  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      tools: createAISDKTools(searchTool),
      prompt: 'Search for something',
      temperature: 0,
      maxRetries: 3,
      abortSignal: AbortSignal.timeout(30000) // 30 second timeout
    })
    
    return result
  } catch (error) {
    console.error('Tool execution failed:', error)
    
    // Fallback to no-tool response
    const fallbackResult = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: 'Provide a general response about searching for information',
      temperature: 0
    })
    
    return fallbackResult
  }
}