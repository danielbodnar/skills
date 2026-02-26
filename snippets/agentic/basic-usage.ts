// Basic Usage Examples for Agentic SDKs

// ==========================================
// Vercel AI SDK Basic Setup
// ==========================================

import { createAISDKTools } from '@agentic/ai-sdk'
import { AgenticToolClient } from '@agentic/platform-tool-client'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import 'dotenv/config'

// Basic text generation with tool
export const basicAISDKExample = async () => {
  // Load a specific tool
  const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
  
  // Create OpenAI client with strict compatibility
  const openai = createOpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict' 
  })

  // Generate text with tool support
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    tools: createAISDKTools(searchTool),
    toolChoice: 'required',
    temperature: 0,
    system: 'You are a helpful assistant. Be as concise as possible.',
    prompt: 'What are the latest TypeScript features?'
  })

  console.log(result.text)
  return result
}

// ==========================================
// LangChain Basic Setup
// ==========================================

import { createLangChainTools } from '@agentic/langchain'
import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents'
import { ChatPromptTemplate } from '@langchain/core/prompts'

export const basicLangChainExample = async () => {
  // Load the search tool
  const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
  
  // Convert to LangChain format
  const tools = createLangChainTools(searchTool)
  
  // Initialize the LLM
  const llm = new ChatOpenAI({ 
    model: 'gpt-4o-mini', 
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY
  })

  // Create a prompt template
  const prompt = ChatPromptTemplate.fromTemplate(`
    You are a helpful assistant. Answer the following question:
    {input}
    
    You have access to the following tools:
    {tools}
    
    Use the tools when needed to provide accurate information.
  `)

  // Create the agent
  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt
  })

  // Create the executor
  const agentExecutor = new AgentExecutor({ 
    agent, 
    tools,
    verbose: true // Enable logging
  })

  // Execute a query
  const result = await agentExecutor.invoke({
    input: 'What is the current Bitcoin price?'
  })

  console.log(result.output)
  return result
}

// ==========================================
// Simple Tool Loading
// ==========================================

export const loadMultipleTools = async () => {
  // Load multiple tools
  const tools = await Promise.all([
    AgenticToolClient.fromIdentifier('@agentic/search'),
    AgenticToolClient.fromIdentifier('@agentic/calculator'),
    AgenticToolClient.fromIdentifier('@agentic/weather')
  ])

  return tools
}

// ==========================================
// Basic Streaming Example
// ==========================================

export const streamingExample = async () => {
  const searchTool = await AgenticToolClient.fromIdentifier('@agentic/search')
  const openai = createOpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict' 
  })

  // Stream text generation
  const stream = await streamText({
    model: openai('gpt-4o-mini'),
    tools: createAISDKTools(searchTool),
    temperature: 0,
    prompt: 'Write a brief summary about artificial intelligence'
  })

  // Process the stream
  for await (const chunk of stream.textStream) {
    process.stdout.write(chunk)
  }

  return stream
}

// ==========================================
// Environment Setup Helper
// ==========================================

export const checkEnvironment = () => {
  const required = ['OPENAI_API_KEY']
  const optional = ['AGENTIC_API_KEY']
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  console.log('✓ Environment configured correctly')
  
  optional.forEach(key => {
    if (!process.env[key]) {
      console.log(`ℹ Optional variable ${key} not set`)
    }
  })
}