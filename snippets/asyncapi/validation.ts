// AsyncAPI Validation Examples
// Demonstrates document validation, message validation, and schema checking

import { Parser } from '@asyncapi/parser';
import { validateMessage } from '@asyncapi/message-validator';
import { Effect, pipe } from 'effect';
import { AsyncAPIDocument } from '@asyncapi/parser';

// Document Validation
export class AsyncAPIValidator {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  async validateDocument(document: string): Promise<ValidationResult> {
    try {
      const { document: parsedDoc, diagnostics } = await this.parser.parse(document);

      if (parsedDoc) {
        return {
          isValid: true,
          document: parsedDoc,
          diagnostics: diagnostics.length > 0 ? diagnostics : undefined
        };
      } else {
        return {
          isValid: false,
          errors: diagnostics.map(d => ({
            message: d.message,
            path: d.path?.join('.'),
            severity: d.severity
          }))
        };
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 0
        }]
      };
    }
  }

  async validateDocumentStrict(document: string): Promise<StrictValidationResult> {
    const result = await this.validateDocument(document);
    
    if (!result.isValid) {
      return {
        ...result,
        isStrictValid: false
      };
    }

    // Additional strict checks
    const strictErrors: ValidationError[] = [];
    const doc = result.document!;

    // Check if all channels have operations
    const channels = doc.channels();
    const operations = doc.operations();
    
    for (const channel of channels.all()) {
      const hasOperation = operations.all().some(op => 
        op.channels().all().some(opChannel => opChannel.id() === channel.id())
      );
      
      if (!hasOperation) {
        strictErrors.push({
          message: `Channel '${channel.id()}' has no associated operations`,
          path: `channels.${channel.id()}`,
          severity: 1
        });
      }
    }

    return {
      ...result,
      isStrictValid: strictErrors.length === 0,
      strictErrors: strictErrors.length > 0 ? strictErrors : undefined
    };
  }
}

// Message Validation
export class MessageValidator {
  static async validateMessage(
    messagePayload: any,
    asyncapiDocument: string | AsyncAPIDocument,
    channelName: string,
    messageName: string
  ): Promise<MessageValidationResult> {
    try {
      let document: AsyncAPIDocument;
      
      if (typeof asyncapiDocument === 'string') {
        const parser = new Parser();
        const parseResult = await parser.parse(asyncapiDocument);
        
        if (!parseResult.document) {
          return {
            isValid: false,
            errors: parseResult.diagnostics.map(d => d.message)
          };
        }
        
        document = parseResult.document;
      } else {
        document = asyncapiDocument;
      }

      const isValid = validateMessage(messagePayload, document, channelName, messageName);

      return {
        isValid,
        payload: messagePayload,
        channelName,
        messageName
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed']
      };
    }
  }

  static async validateMessageBatch(
    messages: Array<{
      payload: any;
      channelName: string;
      messageName: string;
    }>,
    asyncapiDocument: string | AsyncAPIDocument
  ): Promise<BatchValidationResult> {
    const results = await Promise.all(
      messages.map(msg => 
        this.validateMessage(
          msg.payload,
          asyncapiDocument,
          msg.channelName,
          msg.messageName
        )
      )
    );

    const validMessages = results.filter(r => r.isValid);
    const invalidMessages = results.filter(r => !r.isValid);

    return {
      totalMessages: messages.length,
      validMessages: validMessages.length,
      invalidMessages: invalidMessages.length,
      results,
      isAllValid: invalidMessages.length === 0
    };
  }
}

// Effect-TS Validation
export class EffectValidator {
  static validateDocument = (document: string) =>
    Effect.gen(function* () {
      const parser = new Parser();
      
      const parseResult = yield* Effect.tryPromise({
        try: () => parser.parse(document),
        catch: (error) => new ValidationError({
          type: 'PARSE_ERROR',
          message: error instanceof Error ? error.message : 'Parse failed',
          document
        })
      });

      if (!parseResult.document) {
        yield* Effect.fail(new ValidationError({
          type: 'INVALID_DOCUMENT',
          message: 'Document validation failed',
          diagnostics: parseResult.diagnostics
        }));
      }

      return {
        document: parseResult.document,
        diagnostics: parseResult.diagnostics
      };
    });

  static validateMessage = (
    payload: any,
    document: AsyncAPIDocument,
    channelName: string,
    messageName: string
  ) =>
    Effect.gen(function* () {
      const isValid = validateMessage(payload, document, channelName, messageName);
      
      if (!isValid) {
        yield* Effect.fail(new MessageValidationError({
          payload,
          channelName,
          messageName,
          message: 'Message validation failed'
        }));
      }

      return { payload, channelName, messageName, isValid: true };
    });
}

// Schema Validation Utilities
export class SchemaValidator {
  static validatePayloadAgainstSchema(payload: any, schema: any): SchemaValidationResult {
    try {
      // This would typically use a JSON Schema validator like Ajv
      // For demonstration, we'll do basic type checking
      
      if (schema.type === 'object' && typeof payload !== 'object') {
        return {
          isValid: false,
          errors: [`Expected object, got ${typeof payload}`]
        };
      }

      if (schema.properties) {
        const errors: string[] = [];
        
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const propValue = payload[key];
          const prop = propSchema as any;
          
          if (schema.required?.includes(key) && propValue === undefined) {
            errors.push(`Missing required property: ${key}`);
          }
          
          if (propValue !== undefined && prop.type && typeof propValue !== prop.type) {
            errors.push(`Property ${key}: expected ${prop.type}, got ${typeof propValue}`);
          }
        }

        if (errors.length > 0) {
          return { isValid: false, errors };
        }
      }

      return { isValid: true, payload };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Schema validation failed']
      };
    }
  }

  static extractSchemaFromDocument(
    document: AsyncAPIDocument,
    schemaPath: string
  ): any {
    // Navigate to schema using path like "#/components/schemas/UserPayload"
    const pathParts = schemaPath.replace('#/', '').split('/');
    let current: any = document;

    for (const part of pathParts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return null;
      }
    }

    return current;
  }
}

// Runtime Message Validation
export class RuntimeValidator {
  private document: AsyncAPIDocument;

  constructor(document: AsyncAPIDocument) {
    this.document = document;
  }

  createMessageValidator(channelName: string, messageName: string) {
    return (payload: any): MessageValidationResult => {
      const isValid = validateMessage(payload, this.document, channelName, messageName);
      
      return {
        isValid,
        payload,
        channelName,
        messageName,
        errors: isValid ? undefined : ['Message validation failed']
      };
    };
  }

  createChannelValidator(channelName: string) {
    const channel = this.document.channels().get(channelName);
    
    if (!channel) {
      throw new Error(`Channel '${channelName}' not found`);
    }

    const messageValidators = new Map<string, (payload: any) => MessageValidationResult>();
    
    for (const message of channel.messages().all()) {
      messageValidators.set(
        message.id(),
        this.createMessageValidator(channelName, message.id())
      );
    }

    return {
      validateMessage: (messageName: string, payload: any) => {
        const validator = messageValidators.get(messageName);
        if (!validator) {
          return {
            isValid: false,
            errors: [`Message '${messageName}' not found in channel '${channelName}'`],
            payload,
            channelName,
            messageName
          };
        }
        return validator(payload);
      },
      getAvailableMessages: () => Array.from(messageValidators.keys())
    };
  }
}

// Type Definitions
export interface ValidationResult {
  isValid: boolean;
  document?: AsyncAPIDocument;
  diagnostics?: any[];
  errors?: ValidationError[];
}

export interface StrictValidationResult extends ValidationResult {
  isStrictValid: boolean;
  strictErrors?: ValidationError[];
}

export interface ValidationError {
  message: string;
  path?: string;
  severity: number;
}

export interface MessageValidationResult {
  isValid: boolean;
  payload?: any;
  channelName?: string;
  messageName?: string;
  errors?: string[];
}

export interface BatchValidationResult {
  totalMessages: number;
  validMessages: number;
  invalidMessages: number;
  results: MessageValidationResult[];
  isAllValid: boolean;
}

export interface SchemaValidationResult {
  isValid: boolean;
  payload?: any;
  errors?: string[];
}

// Custom Error Classes for Effect-TS
export class ValidationError extends Error {
  constructor(public details: {
    type: string;
    message: string;
    document?: string;
    diagnostics?: any[];
  }) {
    super(details.message);
    this.name = 'ValidationError';
  }
}

export class MessageValidationError extends Error {
  constructor(public details: {
    payload: any;
    channelName: string;
    messageName: string;
    message: string;
  }) {
    super(details.message);
    this.name = 'MessageValidationError';
  }
}

// Usage Examples
export async function validationExamples() {
  const asyncapiDoc = `
asyncapi: 3.0.0
info:
  title: User Service
  version: 1.0.0
channels:
  userEvents:
    address: 'user/events'
    messages:
      userCreated:
        payload:
          type: object
          properties:
            id: { type: string }
            name: { type: string }
            email: { type: string }
          required: [id, name, email]
`;

  // Document validation
  const validator = new AsyncAPIValidator();
  const docResult = await validator.validateDocument(asyncapiDoc);
  console.log('Document validation:', docResult);

  // Message validation
  const validPayload = { id: '123', name: 'John', email: 'john@example.com' };
  const invalidPayload = { id: '123', name: 'John' }; // missing email

  const msgResult1 = await MessageValidator.validateMessage(
    validPayload,
    asyncapiDoc,
    'userEvents',
    'userCreated'
  );
  console.log('Valid message:', msgResult1);

  const msgResult2 = await MessageValidator.validateMessage(
    invalidPayload,
    asyncapiDoc,
    'userEvents',
    'userCreated'
  );
  console.log('Invalid message:', msgResult2);

  // Batch validation
  const messages = [
    { payload: validPayload, channelName: 'userEvents', messageName: 'userCreated' },
    { payload: invalidPayload, channelName: 'userEvents', messageName: 'userCreated' }
  ];

  const batchResult = await MessageValidator.validateMessageBatch(messages, asyncapiDoc);
  console.log('Batch validation:', batchResult);
}

// Effect-TS validation pipeline
export const validationPipeline = (document: string, payload: any) =>
  pipe(
    EffectValidator.validateDocument(document),
    Effect.flatMap(({ document: doc }) =>
      EffectValidator.validateMessage(payload, doc, 'userEvents', 'userCreated')
    ),
    Effect.map(result => `Message validation successful: ${result.isValid}`)
  );

export {
  AsyncAPIValidator,
  MessageValidator,
  EffectValidator,
  SchemaValidator,
  RuntimeValidator
};