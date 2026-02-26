// AsyncAPI Code Generation Examples
// Demonstrates how to use AsyncAPI Generator for code generation

import { Generator } from '@asyncapi/generator';
import { Effect, pipe } from 'effect';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Generator Configuration Interface
export interface GeneratorConfig {
  templateName: string;
  outputDir: string;
  forceWrite?: boolean;
  debug?: boolean;
  params?: Record<string, any>;
}

// AsyncAPI Code Generator Class
export class AsyncAPICodeGenerator {
  private generator: Generator;

  constructor(private config: GeneratorConfig) {
    this.generator = new Generator(
      config.templateName,
      config.outputDir,
      {
        forceWrite: config.forceWrite ?? true,
        debug: config.debug ?? false,
        ...config.params
      }
    );
  }

  // Generate from AsyncAPI document string
  async generateFromString(document: string): Promise<void> {
    try {
      await this.generator.generateFromString(document);
      console.log(`✅ Code generated successfully in ${this.config.outputDir}`);
    } catch (error) {
      console.error('❌ Code generation failed:', error);
      throw error;
    }
  }

  // Generate from AsyncAPI document file
  async generateFromFile(documentPath: string): Promise<void> {
    try {
      await this.generator.generateFromFile(documentPath);
      console.log(`✅ Code generated successfully in ${this.config.outputDir}`);
    } catch (error) {
      console.error('❌ Code generation failed:', error);
      throw error;
    }
  }

  // Generate with custom parameters
  async generateWithParams(document: string, params: Record<string, any>): Promise<void> {
    const generator = new Generator(
      this.config.templateName,
      this.config.outputDir,
      {
        forceWrite: this.config.forceWrite ?? true,
        debug: this.config.debug ?? false,
        ...params
      }
    );

    try {
      await generator.generateFromString(document);
      console.log(`✅ Code generated with custom params in ${this.config.outputDir}`);
    } catch (error) {
      console.error('❌ Code generation failed:', error);
      throw error;
    }
  }
}

// Effect-TS Based Generator
export class EffectAsyncAPIGenerator {
  static generateFromString = (config: GeneratorConfig, document: string) =>
    Effect.gen(function* () {
      const generator = new Generator(
        config.templateName,
        config.outputDir,
        {
          forceWrite: config.forceWrite ?? true,
          debug: config.debug ?? false,
          ...config.params
        }
      );

      yield* Effect.tryPromise({
        try: () => generator.generateFromString(document),
        catch: (error) => new GenerationError({ 
          template: config.templateName,
          outputDir: config.outputDir,
          cause: error 
        })
      });

      return `Code generated successfully at ${config.outputDir}`;
    });

  static generateFromFile = (config: GeneratorConfig, documentPath: string) =>
    Effect.gen(function* () {
      const generator = new Generator(
        config.templateName,
        config.outputDir,
        {
          forceWrite: config.forceWrite ?? true,
          debug: config.debug ?? false,
          ...config.params
        }
      );

      yield* Effect.tryPromise({
        try: () => generator.generateFromFile(documentPath),
        catch: (error) => new GenerationError({ 
          template: config.templateName,
          outputDir: config.outputDir,
          cause: error 
        })
      });

      return `Code generated successfully at ${config.outputDir}`;
    });
}

// Custom Error Types
export class GenerationError extends Error {
  constructor(public details: {
    template: string;
    outputDir: string;
    cause: unknown;
  }) {
    super(`Code generation failed for template ${details.template}`);
    this.name = 'GenerationError';
  }
}

// Popular Template Configurations
export const Templates = {
  // Node.js/Express Server
  nodejs: (outputDir: string): GeneratorConfig => ({
    templateName: '@asyncapi/nodejs-template',
    outputDir,
    params: {
      server: 'production'
    }
  }),

  // TypeScript Models
  typescript: (outputDir: string): GeneratorConfig => ({
    templateName: '@asyncapi/ts-nats-template',
    outputDir,
    params: {
      generateTestClient: true,
      promisifyReplyCallback: true
    }
  }),

  // HTML Documentation
  htmlDocs: (outputDir: string): GeneratorConfig => ({
    templateName: '@asyncapi/html-template',
    outputDir,
    params: {
      sidebarOrganization: 'byTags',
      baseHref: '/'
    }
  }),

  // Markdown Documentation
  markdownDocs: (outputDir: string): GeneratorConfig => ({
    templateName: '@asyncapi/markdown-template',
    outputDir,
    params: {
      outFilename: 'asyncapi.md'
    }
  }),

  // Java Spring
  javaSpring: (outputDir: string): GeneratorConfig => ({
    templateName: '@asyncapi/java-spring-template',
    outputDir,
    params: {
      package: 'com.asyncapi.example',
      artifactId: 'spring-asyncapi-example'
    }
  }),

  // Python Pydantic
  pythonPydantic: (outputDir: string): GeneratorConfig => ({
    templateName: '@asyncapi/python-pydantic-template',
    outputDir,
    params: {
      package: 'asyncapi_models'
    }
  })
};

// Multi-Template Generation
export class MultiTemplateGenerator {
  private configs: GeneratorConfig[];

  constructor(baseOutputDir: string) {
    this.configs = [
      Templates.nodejs(path.join(baseOutputDir, 'server')),
      Templates.typescript(path.join(baseOutputDir, 'client')),
      Templates.htmlDocs(path.join(baseOutputDir, 'docs')),
      Templates.markdownDocs(path.join(baseOutputDir, 'docs'))
    ];
  }

  async generateAll(document: string): Promise<void> {
    console.log('🚀 Starting multi-template generation...');

    for (const config of this.configs) {
      console.log(`📦 Generating ${config.templateName}...`);
      const generator = new AsyncAPICodeGenerator(config);
      await generator.generateFromString(document);
    }

    console.log('✅ All templates generated successfully!');
  }

  // Effect-TS version
  generateAllWithEffect = (document: string) =>
    Effect.gen(function* () {
      console.log('🚀 Starting multi-template generation with Effect...');

      for (const config of this.configs) {
        console.log(`📦 Generating ${config.templateName}...`);
        yield* EffectAsyncAPIGenerator.generateFromString(config, document);
      }

      return 'All templates generated successfully!';
    });
}

// CLI Integration Example
export interface GeneratorCLIOptions {
  template: string;
  output: string;
  file?: string;
  param?: string[];
  forceWrite?: boolean;
  debug?: boolean;
}

export async function runGeneratorCLI(options: GeneratorCLIOptions): Promise<void> {
  const params: Record<string, any> = {};
  
  // Parse parameter strings like "key=value"
  if (options.param) {
    for (const param of options.param) {
      const [key, value] = param.split('=');
      params[key] = value;
    }
  }

  const config: GeneratorConfig = {
    templateName: options.template,
    outputDir: options.output,
    forceWrite: options.forceWrite,
    debug: options.debug,
    params
  };

  const generator = new AsyncAPICodeGenerator(config);

  if (options.file) {
    await generator.generateFromFile(options.file);
  } else {
    throw new Error('Document file path is required');
  }
}

// Usage Examples
export async function codeGenerationExamples() {
  const asyncapiDoc = `
asyncapi: 3.0.0
info:
  title: User Service
  version: 1.0.0
servers:
  production:
    host: api.example.com
    protocol: websocket
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
operations:
  onUserCreated:
    action: receive
    channel:
      $ref: '#/channels/userEvents'
`;

  // Generate Node.js server
  const nodeGenerator = new AsyncAPICodeGenerator(Templates.nodejs('./output/server'));
  await nodeGenerator.generateFromString(asyncapiDoc);

  // Generate TypeScript client
  const tsGenerator = new AsyncAPICodeGenerator(Templates.typescript('./output/client'));
  await tsGenerator.generateFromString(asyncapiDoc);

  // Generate documentation
  const docsGenerator = new AsyncAPICodeGenerator(Templates.htmlDocs('./output/docs'));
  await docsGenerator.generateFromString(asyncapiDoc);

  // Multi-template generation
  const multiGenerator = new MultiTemplateGenerator('./output');
  await multiGenerator.generateAll(asyncapiDoc);
}

// Effect-TS Code Generation Pipeline
export const codeGenerationPipeline = (
  document: string,
  outputDir: string
) =>
  pipe(
    Effect.all([
      EffectAsyncAPIGenerator.generateFromString(
        Templates.nodejs(path.join(outputDir, 'server')),
        document
      ),
      EffectAsyncAPIGenerator.generateFromString(
        Templates.typescript(path.join(outputDir, 'client')),
        document
      ),
      EffectAsyncAPIGenerator.generateFromString(
        Templates.htmlDocs(path.join(outputDir, 'docs')),
        document
      )
    ], { concurrency: 3 }),
    Effect.map(() => 'All code generation completed successfully')
  );

// Template Discovery and Management
export class TemplateManager {
  static async discoverTemplates(): Promise<string[]> {
    // This would typically query npm registry or local templates
    return [
      '@asyncapi/nodejs-template',
      '@asyncapi/typescript-template',
      '@asyncapi/html-template',
      '@asyncapi/markdown-template',
      '@asyncapi/java-spring-template',
      '@asyncapi/python-pydantic-template'
    ];
  }

  static async installTemplate(templateName: string): Promise<void> {
    console.log(`Installing template: ${templateName}`);
    // Implementation would use package manager to install template
  }

  static getTemplateInfo(templateName: string): {
    name: string;
    description: string;
    supportedProtocols: string[];
    parameters: string[];
  } {
    const templates = {
      '@asyncapi/nodejs-template': {
        name: 'Node.js/Express Server',
        description: 'Generate Node.js server with Express and protocol-specific libraries',
        supportedProtocols: ['mqtt', 'amqp', 'redis', 'ws'],
        parameters: ['server', 'securityScheme', 'generateTestClient']
      },
      '@asyncapi/typescript-template': {
        name: 'TypeScript Client',
        description: 'Generate TypeScript client with type definitions',
        supportedProtocols: ['ws', 'http'],
        parameters: ['generateClient', 'generateTypes']
      }
    };

    return templates[templateName as keyof typeof templates] || {
      name: templateName,
      description: 'Custom template',
      supportedProtocols: [],
      parameters: []
    };
  }
}

export {
  AsyncAPICodeGenerator,
  EffectAsyncAPIGenerator,
  MultiTemplateGenerator,
  Templates,
  codeGenerationPipeline
};