// Schema Validation Examples for xsAI with xsschema

import { validate, toJsonSchema, toJsonSchemaSync, initToJsonSchemaSyncVendor, jsonSchema, strictJsonSchema } from 'xsschema'
import { generateObject } from '@xsai/generate-object'
import { type } from 'arktype'
import { Schema } from 'effect'
import * as S from 'sury'
import * as v from 'valibot'
import * as z from 'zod'
import { env } from 'node:process'

// ============================================
// 1. Multi-Library Schema Validation
// ============================================

export async function multiLibraryValidation() {
  const testData = {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com',
  }
  
  // Define schemas in different libraries
  const arktypeSchema = type({
    name: 'string',
    age: 'number',
    email: 'email',
  })
  
  const effectSchema = Schema.standardSchemaV1(
    Schema.Struct({
      name: Schema.String,
      age: Schema.Number,
      email: Schema.String.pipe(Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/)),
    })
  )
  
  const surySchema = S.schema({
    name: S.string,
    age: S.number,
    email: S.email,
  })
  
  const valibotSchema = v.object({
    name: v.string(),
    age: v.number(),
    email: v.pipe(v.string(), v.email()),
  })
  
  const zodSchema = z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  })
  
  // Validate with each schema
  const results = {
    arktype: await validate(arktypeSchema, testData),
    effect: await validate(effectSchema, testData),
    sury: await validate(surySchema, testData),
    valibot: await validate(valibotSchema, testData),
    zod: await validate(zodSchema, testData),
  }
  
  console.log('Validation results:', results)
  return results
}

// ============================================
// 2. Schema to JSON Schema Conversion (Async)
// ============================================

export async function schemaToJsonSchemaAsync() {
  // Valibot schema with descriptions
  const userSchema = v.pipe(
    v.object({
      id: v.pipe(
        v.string(),
        v.uuid(),
        v.description('Unique user identifier')
      ),
      username: v.pipe(
        v.string(),
        v.minLength(3),
        v.maxLength(20),
        v.description('User login name')
      ),
      email: v.pipe(
        v.string(),
        v.email(),
        v.description('User email address')
      ),
      age: v.pipe(
        v.number(),
        v.minValue(13),
        v.maxValue(120),
        v.description('User age in years')
      ),
      roles: v.pipe(
        v.array(v.union([
          v.literal('admin'),
          v.literal('user'),
          v.literal('moderator'),
        ])),
        v.description('User roles')
      ),
      metadata: v.optional(
        v.record(v.string(), v.unknown()),
        v.description('Additional user metadata')
      ),
    }),
    v.description('User profile schema')
  )
  
  // Convert to JSON Schema
  const jsonSchemaOutput = await toJsonSchema(userSchema)
  
  console.log('Generated JSON Schema:')
  console.log(JSON.stringify(jsonSchemaOutput, null, 2))
  
  return jsonSchemaOutput
}

// ============================================
// 3. Schema to JSON Schema Conversion (Sync)
// ============================================

export async function schemaToJsonSchemaSync() {
  // Initialize vendors first
  await initToJsonSchemaSyncVendor('zod')
  await initToJsonSchemaSyncVendor('valibot')
  
  // Zod schema
  const productSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    price: z.number().positive(),
    inStock: z.boolean(),
    categories: z.array(z.string()),
    specifications: z.record(z.string(), z.union([
      z.string(),
      z.number(),
      z.boolean(),
    ])),
  }).describe('Product catalog schema')
  
  // Convert synchronously
  const jsonSchemaOutput = toJsonSchemaSync(productSchema)
  
  console.log('Product JSON Schema:')
  console.log(JSON.stringify(jsonSchemaOutput, null, 2))
  
  return jsonSchemaOutput
}

// ============================================
// 4. Direct JSON Schema Creation
// ============================================

export function createJsonSchemaDirectly() {
  // Using jsonSchema helper
  const schema = jsonSchema({
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        pattern: '^ORD-[0-9]{6}$',
        description: 'Order identifier',
      },
      customerId: {
        type: 'integer',
        minimum: 1,
        description: 'Customer ID',
      },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productId: { type: 'integer' },
            quantity: { type: 'integer', minimum: 1 },
            price: { type: 'number', minimum: 0 },
          },
          required: ['productId', 'quantity', 'price'],
        },
      },
      total: {
        type: 'number',
        minimum: 0,
        description: 'Order total amount',
      },
      status: {
        type: 'string',
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      },
    },
    required: ['orderId', 'customerId', 'items', 'total', 'status'],
  })
  
  console.log('Direct JSON Schema:', schema)
  return schema
}

// ============================================
// 5. Strict JSON Schema (No Additional Properties)
// ============================================

export function createStrictJsonSchema() {
  const schema = strictJsonSchema({
    type: 'object',
    properties: {
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
      },
      dateOfBirth: {
        type: 'string',
        format: 'date',
      },
      address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string', pattern: '^[A-Z]{2}$' },
          zipCode: { type: 'string', pattern: '^[0-9]{5}(-[0-9]{4})?$' },
        },
        required: ['street', 'city', 'state', 'zipCode'],
      },
    },
    required: ['firstName', 'lastName'],
  })
  
  console.log('Strict schema additionalProperties:', schema.additionalProperties) // false
  return schema
}

// ============================================
// 6. Complex Nested Schema Validation
// ============================================

export async function complexNestedValidation() {
  const CompanySchema = v.object({
    name: v.string(),
    founded: v.number(),
    employees: v.array(v.object({
      id: v.string(),
      name: v.string(),
      department: v.union([
        v.literal('engineering'),
        v.literal('sales'),
        v.literal('marketing'),
        v.literal('hr'),
      ]),
      skills: v.array(v.string()),
      manager: v.optional(v.string()),
    })),
    offices: v.record(
      v.string(),
      v.object({
        address: v.string(),
        employees: v.number(),
        isHeadquarters: v.boolean(),
      })
    ),
    financials: v.object({
      revenue: v.number(),
      profit: v.optional(v.number()),
      funding: v.array(v.object({
        round: v.string(),
        amount: v.number(),
        date: v.string(),
        investors: v.array(v.string()),
      })),
    }),
  })
  
  const testCompany = {
    name: 'TechCorp',
    founded: 2010,
    employees: [
      {
        id: 'emp-001',
        name: 'Alice Johnson',
        department: 'engineering',
        skills: ['TypeScript', 'React', 'Node.js'],
        manager: 'emp-000',
      },
      {
        id: 'emp-002',
        name: 'Bob Smith',
        department: 'sales',
        skills: ['Negotiation', 'CRM'],
      },
    ],
    offices: {
      'San Francisco': {
        address: '123 Tech St',
        employees: 50,
        isHeadquarters: true,
      },
      'New York': {
        address: '456 Business Ave',
        employees: 30,
        isHeadquarters: false,
      },
    },
    financials: {
      revenue: 10000000,
      profit: 2000000,
      funding: [
        {
          round: 'Series A',
          amount: 5000000,
          date: '2015-06-01',
          investors: ['VC Fund 1', 'Angel Investor'],
        },
      ],
    },
  }
  
  const result = await validate(CompanySchema, testCompany)
  console.log('Complex validation result:', result)
  
  return result
}

// ============================================
// 7. Schema with Custom Validation Rules
// ============================================

export async function schemaWithCustomRules() {
  // Zod with custom refinements
  const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .refine(
      (password) => /[A-Z]/.test(password),
      'Password must contain at least one uppercase letter'
    )
    .refine(
      (password) => /[a-z]/.test(password),
      'Password must contain at least one lowercase letter'
    )
    .refine(
      (password) => /[0-9]/.test(password),
      'Password must contain at least one number'
    )
    .refine(
      (password) => /[!@#$%^&*]/.test(password),
      'Password must contain at least one special character'
    )
  
  // Valibot with custom validations
  const emailWithDomainCheck = v.pipe(
    v.string(),
    v.email(),
    v.custom((email) => {
      const allowedDomains = ['company.com', 'partner.org']
      const domain = email.split('@')[1]
      return allowedDomains.includes(domain)
    }, 'Email must be from an allowed domain')
  )
  
  const accountSchema = v.object({
    username: v.pipe(
      v.string(),
      v.minLength(3),
      v.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    ),
    email: emailWithDomainCheck,
    password: v.string(), // Note: Valibot version would need similar custom checks
  })
  
  // Test data
  const validAccount = {
    username: 'john_doe123',
    email: 'john@company.com',
    password: 'SecureP@ss123',
  }
  
  const invalidAccount = {
    username: 'john-doe', // Contains hyphen
    email: 'john@gmail.com', // Not allowed domain
    password: 'weak', // Too short
  }
  
  console.log('Valid account validation:')
  console.log(await validate(accountSchema, validAccount))
  
  console.log('\nInvalid account validation:')
  try {
    await validate(accountSchema, invalidAccount)
  } catch (error) {
    console.log('Validation errors:', error)
  }
}

// ============================================
// 8. Schema for AI Generation
// ============================================

export async function schemaForAIGeneration() {
  // Define a complex schema for AI to generate
  const StorySchema = v.object({
    title: v.pipe(
      v.string(),
      v.minLength(5),
      v.maxLength(100),
      v.description('A captivating story title')
    ),
    genre: v.pipe(
      v.union([
        v.literal('fantasy'),
        v.literal('sci-fi'),
        v.literal('mystery'),
        v.literal('romance'),
        v.literal('thriller'),
      ]),
      v.description('Primary genre of the story')
    ),
    characters: v.pipe(
      v.array(v.object({
        name: v.string(),
        role: v.union([
          v.literal('protagonist'),
          v.literal('antagonist'),
          v.literal('supporting'),
        ]),
        description: v.string(),
        traits: v.array(v.string()),
      })),
      v.minLength(2),
      v.maxLength(5),
      v.description('Main characters in the story')
    ),
    setting: v.object({
      time: v.string(),
      place: v.string(),
      atmosphere: v.string(),
    }),
    plot: v.object({
      exposition: v.string(),
      conflict: v.string(),
      climax: v.string(),
      resolution: v.string(),
    }),
    themes: v.array(v.string()),
    wordCount: v.pipe(
      v.number(),
      v.minValue(100),
      v.maxValue(5000),
    ),
  })
  
  // Use with AI generation
  const { object: story } = await generateObject({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    messages: [
      {
        content: 'Generate a complete story outline for a mystery novel set in Victorian London.',
        role: 'user'
      }
    ],
    model: 'gpt-4o',
    schema: StorySchema,
  })
  
  console.log('Generated Story:')
  console.log('Title:', story.title)
  console.log('Genre:', story.genre)
  console.log('Characters:', story.characters.map(c => c.name).join(', '))
  console.log('Setting:', `${story.setting.time} in ${story.setting.place}`)
  
  return story
}

// ============================================
// 9. Schema Composition and Reuse
// ============================================

export function schemaComposition() {
  // Base schemas for reuse
  const AddressSchema = v.object({
    street: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.pipe(
      v.string(),
      v.regex(/^\d{5}(-\d{4})?$/)
    ),
    country: v.string(),
  })
  
  const ContactSchema = v.object({
    email: v.pipe(v.string(), v.email()),
    phone: v.pipe(
      v.string(),
      v.regex(/^\+?[\d\s\-\(\)]+$/)
    ),
    preferredContact: v.union([
      v.literal('email'),
      v.literal('phone'),
      v.literal('mail'),
    ]),
  })
  
  // Compose into larger schemas
  const PersonSchema = v.object({
    id: v.pipe(v.string(), v.uuid()),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    address: AddressSchema,
    contact: ContactSchema,
  })
  
  const BusinessSchema = v.object({
    id: v.pipe(v.string(), v.uuid()),
    name: v.string(),
    taxId: v.string(),
    headquarters: AddressSchema,
    contact: ContactSchema,
    employees: v.array(PersonSchema),
  })
  
  console.log('Composed schemas created')
  return { PersonSchema, BusinessSchema }
}

// ============================================
// 10. Dynamic Schema Generation
// ============================================

export function dynamicSchemaGeneration(fields: string[]) {
  // Dynamically create a schema based on field requirements
  const schemaFields: Record<string, any> = {}
  
  fields.forEach(field => {
    // Parse field format: "name:type:required"
    const [name, type, required] = field.split(':')
    
    let fieldSchema
    switch (type) {
      case 'string':
        fieldSchema = v.string()
        break
      case 'number':
        fieldSchema = v.number()
        break
      case 'boolean':
        fieldSchema = v.boolean()
        break
      case 'email':
        fieldSchema = v.pipe(v.string(), v.email())
        break
      case 'date':
        fieldSchema = v.string() // Could be v.date() with proper parsing
        break
      default:
        fieldSchema = v.unknown()
    }
    
    schemaFields[name] = required === 'optional' 
      ? v.optional(fieldSchema)
      : fieldSchema
  })
  
  const dynamicSchema = v.object(schemaFields)
  
  console.log('Dynamic schema created for fields:', fields)
  return dynamicSchema
}

// ============================================
// Example Runner
// ============================================

export async function runSchemaExamples() {
  console.log('Running xsAI Schema Validation Examples...\n')
  
  try {
    console.log('1. Multi-Library Validation')
    await multiLibraryValidation()
    
    console.log('\n2. Schema to JSON Schema (Async)')
    await schemaToJsonSchemaAsync()
    
    console.log('\n3. Schema to JSON Schema (Sync)')
    await schemaToJsonSchemaSync()
    
    console.log('\n4. Direct JSON Schema')
    createJsonSchemaDirectly()
    
    console.log('\n5. Strict JSON Schema')
    createStrictJsonSchema()
    
    console.log('\n6. Complex Nested Validation')
    await complexNestedValidation()
    
    console.log('\n7. Custom Validation Rules')
    await schemaWithCustomRules()
    
    if (env.OPENAI_API_KEY) {
      console.log('\n8. Schema for AI Generation')
      await schemaForAIGeneration()
    }
    
    console.log('\n9. Schema Composition')
    schemaComposition()
    
    console.log('\n10. Dynamic Schema Generation')
    const fields = ['name:string:required', 'age:number:required', 'email:email:optional']
    dynamicSchemaGeneration(fields)
    
  } catch (error) {
    console.error('Error running schema examples:', error)
  }
}