// Basic Usage Examples for xsAI

import { generateText } from '@xsai/generate-text'
import { streamText } from '@xsai/stream-text'
import { generateObject } from '@xsai/generate-object'
import { streamObject } from '@xsai/stream-object'
import { embed, embedMany } from '@xsai/embed'
import { env } from 'node:process'
import * as v from 'valibot'

// ============================================
// 1. Basic Text Generation
// ============================================

export async function basicTextGeneration() {
  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    messages: [
      {
        content: 'You are a helpful assistant.',
        role: 'system'
      },
      {
        content: 'Why is the sky blue?',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
  })
  
  console.log('Generated text:', text)
  return text
}

// ============================================
// 2. Text Generation with Temperature Control
// ============================================

export async function textWithTemperature() {
  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    messages: [
      {
        content: 'You are a creative writer.',
        role: 'system'
      },
      {
        content: 'Write a haiku about programming.',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    temperature: 0.9, // Higher temperature for more creativity
    maxTokens: 100,
  })
  
  return text
}

// ============================================
// 3. Basic Text Streaming
// ============================================

export async function basicTextStreaming() {
  const { textStream } = await streamText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    messages: [
      {
        content: 'You are a storyteller.',
        role: 'system'
      },
      {
        content: 'Tell me a short story about a robot learning to paint.',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
  })

  const chunks: string[] = []
  for await (const chunk of textStream) {
    process.stdout.write(chunk)
    chunks.push(chunk)
  }
  
  return chunks.join('')
}

// ============================================
// 4. Structured Object Generation
// ============================================

export async function generateStructuredData() {
  const EventSchema = v.object({
    name: v.string(),
    date: v.string(),
    location: v.string(),
    participants: v.array(v.string()),
    description: v.optional(v.string()),
  })

  const { object } = await generateObject({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    messages: [
      {
        content: 'Extract the event information.',
        role: 'system'
      },
      {
        content: 'Alice and Bob are meeting at the Tech Conference on March 15th in San Francisco. Carol will also join them.',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    schema: EventSchema
  })

  console.log('Extracted event:', object)
  return object
}

// ============================================
// 5. Array Generation
// ============================================

export async function generateArrayOfObjects() {
  const CharacterSchema = v.object({
    name: v.string(),
    class: v.pipe(
      v.string(),
      v.description('Character class, e.g. warrior, mage, or thief.')
    ),
    level: v.number(),
    skills: v.array(v.string()),
    backstory: v.string(),
  })

  const { object: characters } = await generateObject({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    messages: [
      {
        content: 'Generate 3 unique RPG character profiles.',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    output: 'array',
    schema: CharacterSchema
  })

  characters.forEach(char => {
    console.log(`${char.name} - Level ${char.level} ${char.class}`)
  })
  
  return characters
}

// ============================================
// 6. Streaming Structured Objects
// ============================================

export async function streamStructuredData() {
  const ProfileSchema = v.object({
    username: v.string(),
    bio: v.string(),
    interests: v.array(v.string()),
    socialLinks: v.object({
      twitter: v.optional(v.string()),
      github: v.optional(v.string()),
      linkedin: v.optional(v.string()),
    })
  })

  const { partialObjectStream } = await streamObject({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    messages: [
      {
        content: 'Generate a detailed developer profile.',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    schema: ProfileSchema
  })

  let finalObject
  for await (const partialObject of partialObjectStream) {
    console.log('Partial update:', partialObject)
    finalObject = partialObject
  }
  
  return finalObject
}

// ============================================
// 7. Single Text Embedding
// ============================================

export async function generateSingleEmbedding() {
  const { embedding } = await embed({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    input: 'The quick brown fox jumps over the lazy dog',
    model: 'text-embedding-3-small',
  })

  console.log('Embedding dimensions:', embedding.length)
  console.log('First 5 values:', embedding.slice(0, 5))
  
  return embedding
}

// ============================================
// 8. Batch Embeddings
// ============================================

export async function generateBatchEmbeddings() {
  const texts = [
    'Machine learning is fascinating',
    'Neural networks mimic brain structure',
    'Deep learning revolutionizes AI',
    'Transformers changed NLP forever',
  ]

  const { embeddings } = await embedMany({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    input: texts,
    model: 'text-embedding-3-small'
  })

  console.log(`Generated ${embeddings.length} embeddings`)
  embeddings.forEach((emb, i) => {
    console.log(`Text ${i}: ${texts[i].substring(0, 30)}... -> ${emb.length} dimensions`)
  })
  
  return embeddings
}

// ============================================
// 9. Multi-Modal Input (Text + Image)
// ============================================

export async function multiModalGeneration() {
  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'What do you see in this image? Describe it in detail.' },
        {
          type: 'image_url',
          image_url: {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg',
          },
        },
      ],
    }],
    model: 'gpt-4o',
  })

  console.log('Image description:', text)
  return text
}

// ============================================
// 10. Conversation with Context
// ============================================

export async function conversationWithContext() {
  const messages = [
    { content: 'You are a helpful math tutor.', role: 'system' as const },
    { content: 'What is the Pythagorean theorem?', role: 'user' as const },
    { content: 'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c²', role: 'assistant' as const },
    { content: 'Can you give me an example?', role: 'user' as const },
  ]

  const { text } = await generateText({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    messages,
    model: 'gpt-4o',
  })

  console.log('Follow-up response:', text)
  return text
}

// ============================================
// Example Runner
// ============================================

export async function runAllExamples() {
  console.log('Running xsAI Basic Usage Examples...\n')
  
  try {
    console.log('1. Basic Text Generation')
    await basicTextGeneration()
    
    console.log('\n2. Text with Temperature')
    await textWithTemperature()
    
    console.log('\n3. Text Streaming')
    await basicTextStreaming()
    
    console.log('\n4. Structured Data')
    await generateStructuredData()
    
    console.log('\n5. Array Generation')
    await generateArrayOfObjects()
    
    console.log('\n6. Streaming Objects')
    await streamStructuredData()
    
    console.log('\n7. Single Embedding')
    await generateSingleEmbedding()
    
    console.log('\n8. Batch Embeddings')
    await generateBatchEmbeddings()
    
    console.log('\n9. Multi-Modal Input')
    await multiModalGeneration()
    
    console.log('\n10. Conversation Context')
    await conversationWithContext()
    
  } catch (error) {
    console.error('Error running examples:', error)
  }
}