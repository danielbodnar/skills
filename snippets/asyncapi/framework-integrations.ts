// AsyncAPI Framework Integration Examples
// Demonstrates integration with popular JavaScript/TypeScript frameworks

import { Effect, pipe } from 'effect';
import { WebSocketServer } from 'ws';
import { createServer } from 'node:http';
import { connect as mqttConnect } from 'mqtt';
import { createClient as redisCreateClient } from 'redis';

// Express.js Integration
export class ExpressAsyncAPIIntegration {
  private app: any; // Express app
  private asyncapiDocument: any;

  constructor(app: any, asyncapiDocument: any) {
    this.app = app;
    this.asyncapiDocument = asyncapiDocument;
  }

  // Setup WebSocket endpoints based on AsyncAPI spec
  setupWebSocketRoutes(): void {
    const server = createServer(this.app);
    const wss = new WebSocketServer({ server });

    // Extract WebSocket channels from AsyncAPI document
    const channels = this.extractWebSocketChannels();

    wss.on('connection', (ws, request) => {
      console.log(`WebSocket connection established: ${request.url}`);

      // Handle incoming messages
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(ws, message);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid JSON message'
          }));
        }
      });

      // Setup channel subscriptions
      channels.forEach(channel => {
        this.setupChannelHandler(ws, channel);
      });
    });

    return server;
  }

  private extractWebSocketChannels(): Array<{
    address: string;
    operations: Array<{ action: string; messages: any[] }>;
  }> {
    // Extract channels that use WebSocket protocol
    return []; // Implementation would parse AsyncAPI document
  }

  private async handleWebSocketMessage(ws: WebSocket, message: any): Promise<void> {
    // Route message based on AsyncAPI specification
    console.log('Handling WebSocket message:', message);
  }

  private setupChannelHandler(ws: WebSocket, channel: any): void {
    // Setup handlers for each channel operation
    console.log(`Setting up channel handler for: ${channel.address}`);
  }

  // REST API documentation endpoint
  setupDocumentationEndpoint(): void {
    this.app.get('/asyncapi', (req: any, res: any) => {
      res.json(this.asyncapiDocument);
    });

    this.app.get('/asyncapi/docs', (req: any, res: any) => {
      const html = this.generateAsyncAPIHTML();
      res.send(html);
    });
  }

  private generateAsyncAPIHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>AsyncAPI Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/@asyncapi/react-component@1.0.0-next.39/styles/default.min.css">
</head>
<body>
  <div id="asyncapi"></div>
  <script src="https://unpkg.com/@asyncapi/react-component@1.0.0-next.39/browser/standalone/index.js"></script>
  <script>
    AsyncApiStandalone.render({
      schema: ${JSON.stringify(this.asyncapiDocument)},
      config: {},
    }, document.getElementById('asyncapi'));
  </script>
</body>
</html>
    `;
  }
}

// NestJS Integration with Decorators
export function AsyncAPIOperation(operationConfig: {
  channel: string;
  action: 'send' | 'receive';
  message: string;
  summary?: string;
  description?: string;
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store AsyncAPI metadata for code generation
    Reflect.defineMetadata('asyncapi:operation', operationConfig, target, propertyKey);
    
    // Enhance method with validation and documentation
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      console.log(`AsyncAPI Operation: ${operationConfig.action} on ${operationConfig.channel}`);
      return originalMethod.apply(this, args);
    };
  };
}

export function AsyncAPIMessage(messageConfig: {
  name: string;
  contentType?: string;
  schema?: any;
  examples?: any[];
}) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata('asyncapi:message', messageConfig, target, propertyKey);
  };
}

// NestJS Service Example
export class UserEventService {
  @AsyncAPIOperation({
    channel: 'user.events',
    action: 'send',
    message: 'UserCreated',
    summary: 'Publish user creation event'
  })
  async publishUserCreated(@AsyncAPIMessage({
    name: 'UserCreated',
    contentType: 'application/json',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' }
      }
    }
  }) userData: { id: string; name: string; email: string }): Promise<void> {
    // Publish to message broker
    console.log('Publishing user created event:', userData);
  }

  @AsyncAPIOperation({
    channel: 'user.events',
    action: 'receive',
    message: 'UserUpdated',
    summary: 'Handle user update event'
  })
  async handleUserUpdated(userData: any): Promise<void> {
    console.log('Handling user updated event:', userData);
  }
}

// Fastify Integration
export class FastifyAsyncAPIIntegration {
  private fastify: any;
  private asyncapiDocument: any;

  constructor(fastify: any, asyncapiDocument: any) {
    this.fastify = fastify;
    this.asyncapiDocument = asyncapiDocument;
  }

  async register(): Promise<void> {
    // Register AsyncAPI routes
    await this.fastify.register(async (fastify: any) => {
      // AsyncAPI documentation endpoint
      fastify.get('/asyncapi.json', async () => {
        return this.asyncapiDocument;
      });

      // WebSocket routes based on AsyncAPI spec
      await this.registerWebSocketRoutes(fastify);
    });
  }

  private async registerWebSocketRoutes(fastify: any): Promise<void> {
    await fastify.register(require('@fastify/websocket'));

    // Extract WebSocket channels and register routes
    const channels = this.extractChannelsFromDocument();
    
    channels.forEach(channel => {
      fastify.register(async (fastify: any) => {
        fastify.get(`/${channel.address}`, { websocket: true }, (connection: any) => {
          connection.socket.on('message', (message: Buffer) => {
            this.handleChannelMessage(channel, message.toString());
          });
        });
      });
    });
  }

  private extractChannelsFromDocument(): Array<{ address: string; operations: any[] }> {
    // Parse AsyncAPI document to extract channel information
    return [];
  }

  private handleChannelMessage(channel: any, message: string): void {
    console.log(`Message received on channel ${channel.address}:`, message);
  }
}

// Socket.IO Integration with Zod Validation
export class SocketIOAsyncAPIIntegration {
  private io: any; // Socket.IO server
  private asyncapiDocument: any;

  constructor(io: any, asyncapiDocument: any) {
    this.io = io;
    this.asyncapiDocument = asyncapiDocument;
  }

  setupEventHandlers(): void {
    this.io.on('connection', (socket: any) => {
      console.log('Socket.IO client connected:', socket.id);

      // Setup handlers based on AsyncAPI operations
      const operations = this.extractOperationsFromDocument();
      
      operations.forEach(operation => {
        if (operation.action === 'receive') {
          socket.on(operation.channel, (data: any) => {
            this.handleOperation(socket, operation, data);
          });
        }
      });
    });
  }

  private extractOperationsFromDocument(): Array<{
    channel: string;
    action: string;
    message: any;
  }> {
    // Parse AsyncAPI document to extract operations
    return [];
  }

  private async handleOperation(socket: any, operation: any, data: any): Promise<void> {
    try {
      // Validate message against AsyncAPI schema
      const isValid = await this.validateMessage(data, operation.message);
      
      if (!isValid) {
        socket.emit('error', { message: 'Invalid message format' });
        return;
      }

      // Process the message
      console.log(`Processing ${operation.channel} message:`, data);
      
      // Emit response if needed
      socket.emit(`${operation.channel}_response`, { status: 'processed' });
    } catch (error) {
      socket.emit('error', { message: 'Message processing failed' });
    }
  }

  private async validateMessage(data: any, messageSchema: any): Promise<boolean> {
    // Implement message validation logic
    return true;
  }
}

// MQTT Integration
export class MQTTAsyncAPIIntegration {
  private client: any;
  private asyncapiDocument: any;

  constructor(brokerUrl: string, asyncapiDocument: any) {
    this.client = mqttConnect(brokerUrl);
    this.asyncapiDocument = asyncapiDocument;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
        this.setupChannelSubscriptions();
        resolve();
      });

      this.client.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  private setupChannelSubscriptions(): void {
    const channels = this.extractMQTTChannels();
    
    channels.forEach(channel => {
      if (channel.subscribe) {
        this.client.subscribe(channel.address, (error: Error) => {
          if (error) {
            console.error(`Failed to subscribe to ${channel.address}:`, error);
          } else {
            console.log(`Subscribed to channel: ${channel.address}`);
          }
        });
      }
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      this.handleMQTTMessage(topic, message.toString());
    });
  }

  private extractMQTTChannels(): Array<{
    address: string;
    subscribe: boolean;
    publish: boolean;
  }> {
    // Extract MQTT channels from AsyncAPI document
    return [];
  }

  private async handleMQTTMessage(topic: string, message: string): Promise<void> {
    try {
      const parsedMessage = JSON.parse(message);
      console.log(`MQTT message received on ${topic}:`, parsedMessage);
      
      // Validate and process message based on AsyncAPI spec
      await this.processMessage(topic, parsedMessage);
    } catch (error) {
      console.error(`Failed to process MQTT message on ${topic}:`, error);
    }
  }

  private async processMessage(topic: string, message: any): Promise<void> {
    // Process message based on AsyncAPI specification
    console.log('Processing message:', { topic, message });
  }

  async publishMessage(channel: string, message: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.publish(channel, JSON.stringify(message), (error: Error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`Message published to ${channel}`);
          resolve();
        }
      });
    });
  }
}

// Redis Pub/Sub Integration
export class RedisAsyncAPIIntegration {
  private publisher: any;
  private subscriber: any;
  private asyncapiDocument: any;

  constructor(redisConfig: any, asyncapiDocument: any) {
    this.publisher = redisCreateClient(redisConfig);
    this.subscriber = redisCreateClient(redisConfig);
    this.asyncapiDocument = asyncapiDocument;
  }

  async connect(): Promise<void> {
    await Promise.all([
      this.publisher.connect(),
      this.subscriber.connect()
    ]);

    console.log('Connected to Redis');
    await this.setupSubscriptions();
  }

  private async setupSubscriptions(): Promise<void> {
    const channels = this.extractRedisChannels();
    
    for (const channel of channels) {
      if (channel.subscribe) {
        await this.subscriber.subscribe(channel.address, (message: string) => {
          this.handleRedisMessage(channel.address, message);
        });
        console.log(`Subscribed to Redis channel: ${channel.address}`);
      }
    }
  }

  private extractRedisChannels(): Array<{
    address: string;
    subscribe: boolean;
    publish: boolean;
  }> {
    // Extract Redis channels from AsyncAPI document
    return [];
  }

  private async handleRedisMessage(channel: string, message: string): Promise<void> {
    try {
      const parsedMessage = JSON.parse(message);
      console.log(`Redis message received on ${channel}:`, parsedMessage);
      
      // Process message based on AsyncAPI specification
      await this.processMessage(channel, parsedMessage);
    } catch (error) {
      console.error(`Failed to process Redis message on ${channel}:`, error);
    }
  }

  private async processMessage(channel: string, message: any): Promise<void> {
    // Process message based on AsyncAPI specification
    console.log('Processing Redis message:', { channel, message });
  }

  async publishMessage(channel: string, message: any): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message));
    console.log(`Message published to Redis channel: ${channel}`);
  }
}

// Effect-TS Integration Helper
export class EffectAsyncAPIIntegration {
  static createMessageHandler = <T>(
    channelName: string,
    messageValidator: (data: unknown) => Effect.Effect<T, Error>,
    processor: (data: T) => Effect.Effect<void, Error>
  ) =>
    (rawMessage: unknown) =>
      pipe(
        messageValidator(rawMessage),
        Effect.tap(data => Effect.sync(() => 
          console.log(`Processing message on ${channelName}:`, data)
        )),
        Effect.flatMap(processor),
        Effect.catchAll(error => 
          Effect.sync(() => console.error(`Error processing ${channelName}:`, error))
        )
      );

  static createPublisher = <T>(
    channelName: string,
    publisher: (message: T) => Promise<void>
  ) =>
    (message: T) =>
      Effect.gen(function* () {
        console.log(`Publishing to ${channelName}:`, message);
        
        yield* Effect.tryPromise({
          try: () => publisher(message),
          catch: (error) => new Error(`Failed to publish to ${channelName}: ${error}`)
        });

        return `Message published to ${channelName}`;
      });
}

// Usage Examples
export async function frameworkIntegrationExamples() {
  // Example AsyncAPI document
  const asyncapiDoc = {
    asyncapi: '3.0.0',
    info: { title: 'User Service', version: '1.0.0' },
    channels: {
      'user.events': {
        address: 'user/events',
        messages: {
          userCreated: {
            payload: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        }
      }
    }
  };

  // Express.js integration
  const express = require('express');
  const app = express();
  const expressIntegration = new ExpressAsyncAPIIntegration(app, asyncapiDoc);
  expressIntegration.setupDocumentationEndpoint();

  // MQTT integration
  const mqttIntegration = new MQTTAsyncAPIIntegration('mqtt://localhost:1883', asyncapiDoc);
  await mqttIntegration.connect();

  // Redis integration
  const redisIntegration = new RedisAsyncAPIIntegration({ host: 'localhost', port: 6379 }, asyncapiDoc);
  await redisIntegration.connect();

  // Effect-TS message handling
  const messageHandler = EffectAsyncAPIIntegration.createMessageHandler(
    'user.events',
    (data: unknown) => Effect.succeed(data as { id: string; name: string; email: string }),
    (data) => Effect.sync(() => console.log('User created:', data))
  );

  await Effect.runPromise(messageHandler({ id: '123', name: 'John', email: 'john@example.com' }));
}

export {
  ExpressAsyncAPIIntegration,
  FastifyAsyncAPIIntegration,
  SocketIOAsyncAPIIntegration,
  MQTTAsyncAPIIntegration,
  RedisAsyncAPIIntegration,
  EffectAsyncAPIIntegration,
  AsyncAPIOperation,
  AsyncAPIMessage,
  UserEventService
};