// Presetter Type Definitions and Schemas
import type { JSONSchema7 } from 'json-schema';

// 1. Core Presetter types
export interface PresetConfig {
  /** Display name for the preset */
  displayName?: string;
  /** Description of what this preset provides */
  description?: string;
  /** Other presets to extend from */
  extends?: (string | PresetConfig)[];
  /** Dependencies to install */
  dependencies?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
  };
  /** Configuration files to generate */
  config?: Record<string, any>;
  /** Template files to copy */
  templates?: Record<string, string>;
  /** Configuration overrides */
  override?: Record<string, any>;
  /** Variables for template substitution */
  variables?: Record<string, any>;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface PresetOptions {
  /** Target ES version */
  target?: 'ES2020' | 'ES2021' | 'ES2022' | 'ES2023' | 'ES2024' | 'ESNext';
  /** Source directory */
  source?: string;
  /** Output directory */
  output?: string;
  /** Module system */
  module?: 'esm' | 'cjs' | 'hybrid';
  /** Enable strict mode */
  strict?: boolean;
  /** Enable testing setup */
  testing?: boolean;
  /** Enable linting */
  linting?: boolean;
  /** Enable formatting */
  formatting?: boolean;
}

export interface PresetContext {
  /** Project root directory */
  root: string;
  /** Package.json content */
  packageJson: any;
  /** Existing configuration files */
  existingConfigs: string[];
  /** Environment variables */
  env: Record<string, string>;
}

// 2. JSON Schema for presetter.config.ts validation
export const presetConfigSchema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Presetter Configuration',
  description: 'Configuration schema for presetter.config.ts files',
  type: 'object',
  properties: {
    displayName: {
      type: 'string',
      description: 'Human-readable name for the preset'
    },
    description: {
      type: 'string',
      description: 'Description of what this preset provides'
    },
    extends: {
      type: 'array',
      description: 'Array of presets to extend from',
      items: {
        oneOf: [
          { type: 'string' },
          { $ref: '#' }
        ]
      }
    },
    dependencies: {
      type: 'object',
      description: 'Dependencies to install',
      properties: {
        dependencies: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        devDependencies: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        peerDependencies: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        optionalDependencies: {
          type: 'object',
          additionalProperties: { type: 'string' }
        }
      },
      additionalProperties: false
    },
    config: {
      type: 'object',
      description: 'Configuration files to generate',
      additionalProperties: true
    },
    templates: {
      type: 'object',
      description: 'Template files to copy',
      additionalProperties: { type: 'string' }
    },
    override: {
      type: 'object',
      description: 'Configuration overrides',
      additionalProperties: true
    },
    variables: {
      type: 'object',
      description: 'Variables for template substitution',
      additionalProperties: { type: 'string' }
    },
    metadata: {
      type: 'object',
      description: 'Additional metadata',
      additionalProperties: true
    }
  },
  additionalProperties: false
};

// 3. TypeScript configuration schema
export const tsConfigSchema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'TypeScript Configuration',
  type: 'object',
  properties: {
    compilerOptions: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['ES3', 'ES5', 'ES6', 'ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ES2020', 'ES2021', 'ES2022', 'ES2023', 'ESNext']
        },
        module: {
          type: 'string',
          enum: ['CommonJS', 'AMD', 'System', 'UMD', 'ES6', 'ES2015', 'ES2020', 'ES2022', 'ESNext', 'Node16', 'NodeNext']
        },
        moduleResolution: {
          type: 'string',
          enum: ['classic', 'node', 'bundler']
        },
        strict: { type: 'boolean' },
        esModuleInterop: { type: 'boolean' },
        skipLibCheck: { type: 'boolean' }
      }
    },
    include: {
      type: 'array',
      items: { type: 'string' }
    },
    exclude: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

// 4. Package.json schema
export const packageJsonSchema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Package.json',
  type: 'object',
  properties: {
    name: { type: 'string' },
    version: { type: 'string' },
    description: { type: 'string' },
    type: {
      type: 'string',
      enum: ['module', 'commonjs']
    },
    main: { type: 'string' },
    module: { type: 'string' },
    types: { type: 'string' },
    exports: {
      type: 'object',
      additionalProperties: true
    },
    scripts: {
      type: 'object',
      additionalProperties: { type: 'string' }
    },
    dependencies: {
      type: 'object',
      additionalProperties: { type: 'string' }
    },
    devDependencies: {
      type: 'object',
      additionalProperties: { type: 'string' }
    },
    peerDependencies: {
      type: 'object',
      additionalProperties: { type: 'string' }
    }
  }
};

// 5. Utility types for type-safe preset creation
export type ConfigFile = 
  | 'tsconfig.json'
  | 'package.json'
  | 'vite.config.ts'
  | 'rollup.config.js'
  | 'biome.json'
  | '.eslintrc.js'
  | 'prettier.config.js'
  | 'vitest.config.ts'
  | 'playwright.config.ts';

export type PresetName = 
  | 'presetter-preset-essentials'
  | 'presetter-preset-monorepo'
  | 'presetter-preset-esm'
  | 'presetter-preset-cjs'
  | 'presetter-preset-hybrid'
  | 'presetter-preset-strict'
  | 'presetter-preset-web'
  | 'presetter-preset-react'
  | 'presetter-preset-rollup'
  | 'presetter-preset-vite';

export interface TypeSafePresetConfig {
  displayName?: string;
  description?: string;
  extends?: PresetName[];
  dependencies?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  config?: Partial<Record<ConfigFile, any>>;
  templates?: Record<string, string>;
  override?: Partial<Record<ConfigFile, any>>;
  variables?: Record<string, string>;
}

// 6. Validation functions
export function validatePresetConfig(config: unknown): config is PresetConfig {
  // Basic validation - in real implementation would use ajv or similar
  if (typeof config !== 'object' || config === null) {
    return false;
  }
  
  const preset = config as PresetConfig;
  
  // Check extends is array if present
  if (preset.extends && !Array.isArray(preset.extends)) {
    return false;
  }
  
  // Check dependencies structure
  if (preset.dependencies) {
    const deps = preset.dependencies;
    const validKeys = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
    if (!Object.keys(deps).every(key => validKeys.includes(key))) {
      return false;
    }
  }
  
  return true;
}

export function isValidPackageName(name: string): boolean {
  const packageNameRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  return packageNameRegex.test(name);
}

export function isValidSemverRange(version: string): boolean {
  const semverRegex = /^(\^|~|>=|<=|>|<|=)?([0-9]+)(\.[0-9]+)?(\.[0-9]+)?(-[a-z0-9-]+(\.[a-z0-9-]+)*)?(\+[a-z0-9-]+(\.[a-z0-9-]+)*)?$/i;
  return semverRegex.test(version);
}

// 7. Template variable types
export interface TemplateVariables {
  /** Project name */
  name: string;
  /** Project version */
  version: string;
  /** Author name */
  author?: string;
  /** Author email */
  email?: string;
  /** License type */
  license?: string;
  /** Target ES version */
  target: string;
  /** Source directory */
  source: string;
  /** Output directory */
  output: string;
  /** Test directory */
  testDir?: string;
  /** Documentation directory */
  docsDir?: string;
}

// 8. Preset factory types
export type PresetFactory<T = {}> = (options?: T) => PresetConfig;

export interface PresetFactoryOptions {
  /** Enable TypeScript support */
  typescript?: boolean;
  /** Enable React support */
  react?: boolean;
  /** Enable Vue support */
  vue?: boolean;
  /** Enable testing setup */
  testing?: boolean;
  /** Enable linting */
  linting?: boolean;
  /** Enable PWA features */
  pwa?: boolean;
  /** Enable Docker support */
  docker?: boolean;
  /** Enable Storybook */
  storybook?: boolean;
}

// 9. Configuration merger types
export interface MergeOptions {
  /** How to handle array conflicts */
  arrayMergeStrategy: 'replace' | 'concat' | 'merge';
  /** How to handle object conflicts */
  objectMergeStrategy: 'shallow' | 'deep';
  /** Whether to preserve comments in JSON */
  preserveComments?: boolean;
}

export interface ConfigConflict {
  /** File path where conflict occurred */
  file: string;
  /** Property path within the file */
  property: string;
  /** Conflicting values */
  values: any[];
  /** Suggested resolution */
  resolution?: 'latest' | 'merge' | 'manual';
}