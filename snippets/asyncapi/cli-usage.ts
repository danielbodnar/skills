// AsyncAPI CLI Usage Examples
// Demonstrates CLI commands and integration patterns

import { spawn, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { Effect, pipe } from 'effect';
import path from 'node:path';

const execAsync = promisify(exec);

// CLI Command Interface
export interface AsyncAPICLIOptions {
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
}

// CLI Wrapper Class
export class AsyncAPICLI {
  private cliPath: string;

  constructor(cliPath: string = 'asyncapi') {
    this.cliPath = cliPath;
  }

  // Execute CLI command
  async execute(command: string, args: string[] = [], options: {
    cwd?: string;
    env?: Record<string, string>;
  } = {}): Promise<CLIResult> {
    try {
      const cmd = `${this.cliPath} ${command} ${args.join(' ')}`;
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env }
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command: cmd
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || error.message,
        command: `${this.cliPath} ${command} ${args.join(' ')}`,
        exitCode: error.code
      };
    }
  }

  // Validate AsyncAPI document
  async validate(filePath: string, options: {
    diagnostics?: boolean;
    strict?: boolean;
  } = {}): Promise<CLIResult> {
    const args = [filePath];
    
    if (options.diagnostics) args.push('--diagnostics');
    if (options.strict) args.push('--strict');

    return this.execute('validate', args);
  }

  // Generate code from template
  async generate(
    templateName: string,
    asyncapiFile: string,
    outputDir: string,
    options: {
      forceWrite?: boolean;
      install?: boolean;
      debug?: boolean;
      params?: Record<string, string>;
    } = {}
  ): Promise<CLIResult> {
    const args = ['fromTemplate', asyncapiFile, templateName, '--output', outputDir];
    
    if (options.forceWrite) args.push('--force-write');
    if (options.install) args.push('--install');
    if (options.debug) args.push('--debug');
    
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        args.push('--param', `${key}=${value}`);
      }
    }

    return this.execute('generate', args);
  }

  // Create new AsyncAPI document
  async newDocument(options: {
    file?: string;
    example?: string;
    template?: string;
  } = {}): Promise<CLIResult> {
    const args = ['file'];
    
    if (options.file) args.push('--file-name', options.file);
    if (options.example) args.push('--example', options.example);
    if (options.template) args.push('--template', options.template);

    return this.execute('new', args);
  }

  // Convert AsyncAPI version
  async convert(
    inputFile: string,
    options: {
      targetVersion?: string;
      output?: string;
    } = {}
  ): Promise<CLIResult> {
    const args = [inputFile];
    
    if (options.targetVersion) args.push('--target-version', options.targetVersion);
    if (options.output) args.push('--output', options.output);

    return this.execute('convert', args);
  }

  // Optimize AsyncAPI document
  async optimize(
    inputFile: string,
    options: {
      output?: string;
      optimization?: string[];
    } = {}
  ): Promise<CLIResult> {
    const args = [inputFile];
    
    if (options.output) args.push('--output', options.output);
    if (options.optimization) {
      options.optimization.forEach(opt => args.push('--optimization', opt));
    }

    return this.execute('optimize', args);
  }

  // Start AsyncAPI Studio
  async startStudio(options: {
    port?: number;
    host?: string;
  } = {}): Promise<CLIResult> {
    const args = ['studio'];
    
    if (options.port) args.push('--port', options.port.toString());
    if (options.host) args.push('--host', options.host);

    return this.execute('start', args);
  }

  // Bundle AsyncAPI documents
  async bundle(
    files: string[],
    options: {
      output?: string;
      baseDir?: string;
    } = {}
  ): Promise<CLIResult> {
    const args = [...files];
    
    if (options.output) args.push('--output', options.output);
    if (options.baseDir) args.push('--base', options.baseDir);

    return this.execute('bundle', args);
  }

  // Diff between AsyncAPI documents
  async diff(
    oldFile: string,
    newFile: string,
    options: {
      format?: 'json' | 'yaml' | 'yml';
      type?: 'breaking' | 'non-breaking' | 'unclassified';
    } = {}
  ): Promise<CLIResult> {
    const args = [oldFile, newFile];
    
    if (options.format) args.push('--format', options.format);
    if (options.type) args.push('--type', options.type);

    return this.execute('diff', args);
  }
}

// Effect-TS CLI Wrapper
export class EffectAsyncAPICLI {
  private cli: AsyncAPICLI;

  constructor(cliPath?: string) {
    this.cli = new AsyncAPICLI(cliPath);
  }

  validate = (filePath: string, options: Parameters<AsyncAPICLI['validate']>[1] = {}) =>
    Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () => this.cli.validate(filePath, options),
        catch: (error) => new CLIError({
          command: 'validate',
          message: error instanceof Error ? error.message : 'Validation failed'
        })
      });

      if (!result.success) {
        yield* Effect.fail(new CLIError({
          command: 'validate',
          message: result.stderr || 'Validation failed',
          exitCode: result.exitCode
        }));
      }

      return result;
    });

  generate = (
    templateName: string,
    asyncapiFile: string,
    outputDir: string,
    options: Parameters<AsyncAPICLI['generate']>[3] = {}
  ) =>
    Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () => this.cli.generate(templateName, asyncapiFile, outputDir, options),
        catch: (error) => new CLIError({
          command: 'generate',
          message: error instanceof Error ? error.message : 'Generation failed'
        })
      });

      if (!result.success) {
        yield* Effect.fail(new CLIError({
          command: 'generate',
          message: result.stderr || 'Generation failed',
          exitCode: result.exitCode
        }));
      }

      return result;
    });

  convert = (inputFile: string, options: Parameters<AsyncAPICLI['convert']>[1] = {}) =>
    Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () => this.cli.convert(inputFile, options),
        catch: (error) => new CLIError({
          command: 'convert',
          message: error instanceof Error ? error.message : 'Conversion failed'
        })
      });

      if (!result.success) {
        yield* Effect.fail(new CLIError({
          command: 'convert',
          message: result.stderr || 'Conversion failed',
          exitCode: result.exitCode
        }));
      }

      return result;
    });
}

// Project Integration Helper
export class AsyncAPIProjectIntegration {
  private cli: AsyncAPICLI;
  private projectRoot: string;

  constructor(projectRoot: string, cliPath?: string) {
    this.cli = new AsyncAPICLI(cliPath);
    this.projectRoot = projectRoot;
  }

  // Initialize AsyncAPI in project
  async initProject(options: {
    specFile?: string;
    example?: string;
  } = {}): Promise<void> {
    const specFile = options.specFile || 'asyncapi.yaml';
    const specPath = path.join(this.projectRoot, specFile);

    // Create new AsyncAPI document
    const result = await this.cli.newDocument({
      file: specPath,
      example: options.example || 'default-example'
    });

    if (!result.success) {
      throw new Error(`Failed to initialize AsyncAPI: ${result.stderr}`);
    }

    console.log(`✅ AsyncAPI document created at ${specPath}`);
  }

  // Setup development workflow
  async setupDevWorkflow(): Promise<void> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    try {
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
      
      // Add AsyncAPI scripts
      packageJson.scripts = {
        ...packageJson.scripts,
        'asyncapi:validate': 'asyncapi validate asyncapi.yaml',
        'asyncapi:generate': 'asyncapi generate fromTemplate asyncapi.yaml @asyncapi/nodejs-template',
        'asyncapi:docs': 'asyncapi generate fromTemplate asyncapi.yaml @asyncapi/html-template --output ./docs',
        'asyncapi:studio': 'asyncapi start studio'
      };

      // Add dev dependencies
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        '@asyncapi/cli': '^latest'
      };

      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ AsyncAPI scripts added to package.json');
    } catch (error) {
      console.warn('Could not update package.json:', error);
    }
  }

  // Generate project assets
  async generateProjectAssets(asyncapiFile: string = 'asyncapi.yaml'): Promise<void> {
    const asyncapiPath = path.join(this.projectRoot, asyncapiFile);
    
    // Create output directories
    await mkdir(path.join(this.projectRoot, 'src', 'generated'), { recursive: true });
    await mkdir(path.join(this.projectRoot, 'docs'), { recursive: true });

    // Generate TypeScript types
    const tsResult = await this.cli.generate(
      '@asyncapi/ts-nats-template',
      asyncapiPath,
      path.join(this.projectRoot, 'src', 'generated'),
      { forceWrite: true }
    );

    if (tsResult.success) {
      console.log('✅ TypeScript types generated');
    }

    // Generate documentation
    const docsResult = await this.cli.generate(
      '@asyncapi/html-template',
      asyncapiPath,
      path.join(this.projectRoot, 'docs'),
      { forceWrite: true }
    );

    if (docsResult.success) {
      console.log('✅ Documentation generated');
    }
  }

  // Validation workflow
  async validateWorkflow(asyncapiFile: string = 'asyncapi.yaml'): Promise<boolean> {
    const asyncapiPath = path.join(this.projectRoot, asyncapiFile);
    
    const result = await this.cli.validate(asyncapiPath, {
      diagnostics: true,
      strict: true
    });

    if (result.success) {
      console.log('✅ AsyncAPI document is valid');
      return true;
    } else {
      console.error('❌ AsyncAPI validation failed:');
      console.error(result.stderr);
      return false;
    }
  }
}

// CI/CD Integration
export class AsyncAPICICD {
  private cli: AsyncAPICLI;

  constructor(cliPath?: string) {
    this.cli = new AsyncAPICLI(cliPath);
  }

  // GitHub Actions workflow
  generateGitHubWorkflow(): string {
    return `
name: AsyncAPI
on:
  push:
    paths:
      - 'asyncapi.yaml'
      - 'asyncapi/**'
  pull_request:
    paths:
      - 'asyncapi.yaml'
      - 'asyncapi/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install AsyncAPI CLI
        run: npm install -g @asyncapi/cli
        
      - name: Validate AsyncAPI Document
        run: asyncapi validate asyncapi.yaml --diagnostics
        
      - name: Generate Documentation
        run: |
          asyncapi generate fromTemplate asyncapi.yaml @asyncapi/html-template --output ./docs --force-write
          
      - name: Deploy Documentation
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
`;
  }

  // Pre-commit hook
  generatePreCommitHook(): string {
    return `#!/bin/sh
# AsyncAPI pre-commit hook

echo "🔍 Validating AsyncAPI document..."

if asyncapi validate asyncapi.yaml --diagnostics; then
  echo "✅ AsyncAPI document is valid"
else
  echo "❌ AsyncAPI validation failed. Please fix errors before committing."
  exit 1
fi

echo "📚 Regenerating documentation..."
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/html-template --output ./docs --force-write

# Add generated docs to commit
git add docs/
`;
  }

  // Docker-based validation
  generateDockerValidation(): string {
    return `
# Dockerfile for AsyncAPI validation
FROM node:18-alpine

WORKDIR /app

RUN npm install -g @asyncapi/cli

COPY asyncapi.yaml .

CMD ["asyncapi", "validate", "asyncapi.yaml", "--diagnostics"]
`;
  }
}

// Type Definitions
export interface CLIResult {
  success: boolean;
  stdout: string;
  stderr: string;
  command: string;
  exitCode?: number;
}

export class CLIError extends Error {
  constructor(public details: {
    command: string;
    message: string;
    exitCode?: number;
  }) {
    super(`CLI command '${details.command}' failed: ${details.message}`);
    this.name = 'CLIError';
  }
}

// Usage Examples
export async function cliUsageExamples() {
  const cli = new AsyncAPICLI();

  // Validate document
  const validateResult = await cli.validate('asyncapi.yaml', {
    diagnostics: true,
    strict: true
  });
  console.log('Validation:', validateResult);

  // Generate Node.js server
  const generateResult = await cli.generate(
    '@asyncapi/nodejs-template',
    'asyncapi.yaml',
    './server',
    {
      forceWrite: true,
      params: {
        server: 'production'
      }
    }
  );
  console.log('Generation:', generateResult);

  // Convert to newer version
  const convertResult = await cli.convert('asyncapi.yaml', {
    targetVersion: '3.0.0',
    output: 'asyncapi-v3.yaml'
  });
  console.log('Conversion:', convertResult);
}

// Effect-TS CLI Pipeline
export const cliPipeline = (asyncapiFile: string, outputDir: string) => {
  const effectCli = new EffectAsyncAPICLI();
  
  return pipe(
    effectCli.validate(asyncapiFile, { diagnostics: true }),
    Effect.flatMap(() => 
      effectCli.generate('@asyncapi/nodejs-template', asyncapiFile, outputDir)
    ),
    Effect.map(() => 'CLI pipeline completed successfully')
  );
};

export {
  AsyncAPICLI,
  EffectAsyncAPICLI,
  AsyncAPIProjectIntegration,
  AsyncAPICICD
};