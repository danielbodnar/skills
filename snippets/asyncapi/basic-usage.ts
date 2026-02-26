// AsyncAPI Basic Usage Examples
// Demonstrates basic AsyncAPI document structure and parsing

import { Parser } from '@asyncapi/parser';
import { AsyncAPIDocument } from '@asyncapi/parser';

// Basic AsyncAPI Document Structure
export const basicAsyncAPIDocument = `
asyncapi: 3.0.0
id: 'urn:example:com:smartylighting:streetlights:server'
info:
  title: Streetlights API
  version: 1.0.0
  description: |
    The Smartylighting Streetlights API allows you to remotely manage 
    the city lights. You can turn a specific streetlight on/off or 
    dim it using a simple API.
  contact:
    name: API Support
    url: https://www.asyncapi.org/support
    email: support@asyncapi.org
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0.html

servers:
  production:
    host: api.streetlights.smartylighting.com
    protocol: mqtt
    description: MQTT broker for production environment
    security:
      - userPassword: []
  development:
    host: localhost:1883
    protocol: mqtt
    description: Development MQTT broker

channels:
  lightingMeasured:
    address: 'smartylighting/streetlights/1/0/event/{streetlightId}/lighting/measured'
    messages:
      lightMeasured:
        $ref: '#/components/messages/lightMeasured'
    parameters:
      streetlightId:
        $ref: '#/components/parameters/streetlightId'

operations:
  receiveLightMeasurement:
    action: receive
    channel:
      $ref: '#/channels/lightingMeasured'
    summary: Inform about environmental lighting conditions of a particular streetlight.

components:
  messages:
    lightMeasured:
      name: lightMeasured
      title: Light measured
      summary: Information about environmental lighting conditions of a particular streetlight.
      contentType: application/json
      tags:
        - name: measurement
      payload:
        $ref: '#/components/schemas/lightMeasuredPayload'
        
  schemas:
    lightMeasuredPayload:
      type: object
      properties:
        lumens:
          type: integer
          minimum: 0
          description: Light intensity measured in lumens
        sentAt:
          type: string
          format: date-time
          description: Date and time when the message was sent
      required:
        - lumens
        - sentAt
        
  parameters:
    streetlightId:
      description: The ID of the streetlight
      schema:
        type: string
        
  securitySchemes:
    userPassword:
      type: userPassword
      description: Provide your username and password for MQTT connection
`;

// Parsing AsyncAPI Documents
export class AsyncAPIParser {
  private parser: Parser;
  
  constructor() {
    this.parser = new Parser();
  }
  
  async parseDocument(document: string): Promise<AsyncAPIDocument | null> {
    try {
      const { document: parsedDoc, diagnostics } = await this.parser.parse(document);
      
      if (diagnostics.length > 0) {
        console.warn('Parser diagnostics:', diagnostics);
      }
      
      return parsedDoc;
    } catch (error) {
      console.error('Failed to parse AsyncAPI document:', error);
      return null;
    }
  }
  
  async validateDocument(document: string): Promise<boolean> {
    const parsedDoc = await this.parseDocument(document);
    return parsedDoc !== null;
  }
}

// Working with Parsed Documents
export class AsyncAPIDocumentProcessor {
  static extractBasicInfo(document: AsyncAPIDocument) {
    return {
      title: document.info().title(),
      version: document.info().version(),
      description: document.info().description(),
      id: document.id(),
      asyncapiVersion: document.version()
    };
  }
  
  static extractServerInfo(document: AsyncAPIDocument) {
    const servers = document.servers();
    return servers.all().map(server => ({
      name: server.id(),
      host: server.host(),
      protocol: server.protocol(),
      description: server.description(),
      url: server.url()
    }));
  }
  
  static extractChannelInfo(document: AsyncAPIDocument) {
    const channels = document.channels();
    return channels.all().map(channel => ({
      address: channel.address(),
      id: channel.id(),
      description: channel.description(),
      messages: channel.messages().all().map(msg => ({
        name: msg.id(),
        title: msg.title(),
        summary: msg.summary(),
        contentType: msg.contentType()
      }))
    }));
  }
  
  static extractOperationInfo(document: AsyncAPIDocument) {
    const operations = document.operations();
    return operations.all().map(operation => ({
      id: operation.id(),
      action: operation.action(),
      summary: operation.summary(),
      description: operation.description(),
      channel: operation.channels().all()[0]?.address()
    }));
  }
}

// Usage Examples
export async function basicUsageExample() {
  const parser = new AsyncAPIParser();
  const processor = AsyncAPIDocumentProcessor;
  
  // Parse the document
  const document = await parser.parseDocument(basicAsyncAPIDocument);
  
  if (!document) {
    throw new Error('Failed to parse AsyncAPI document');
  }
  
  // Extract information
  const basicInfo = processor.extractBasicInfo(document);
  const servers = processor.extractServerInfo(document);
  const channels = processor.extractChannelInfo(document);
  const operations = processor.extractOperationInfo(document);
  
  console.log('Basic Info:', basicInfo);
  console.log('Servers:', servers);
  console.log('Channels:', channels);
  console.log('Operations:', operations);
  
  return {
    basicInfo,
    servers,
    channels,
    operations
  };
}

// Validation Example
export async function validateAsyncAPIDocument(documentContent: string): Promise<{
  isValid: boolean;
  errors?: any[];
  document?: AsyncAPIDocument;
}> {
  const parser = new AsyncAPIParser();
  
  try {
    const document = await parser.parseDocument(documentContent);
    
    if (document) {
      return {
        isValid: true,
        document
      };
    } else {
      return {
        isValid: false,
        errors: ['Failed to parse document']
      };
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [error]
    };
  }
}

// Type-safe Document Creation
export interface StreetlightMessage {
  lumens: number;
  sentAt: string;
}

export function createTypedMessage(data: StreetlightMessage): string {
  return JSON.stringify({
    lumens: data.lumens,
    sentAt: data.sentAt
  });
}

// Export for use in other modules
export { basicAsyncAPIDocument, AsyncAPIParser, AsyncAPIDocumentProcessor };