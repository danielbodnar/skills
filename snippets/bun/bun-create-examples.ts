/**
 * Bun Create - Project Templating Examples
 * 
 * Comprehensive examples for using `bun create` to scaffold projects from various sources.
 * Includes React components, npm packages, GitHub repos, and local templates.
 * 
 * @see https://bun.sh/docs/cli/bun-create
 * @see /home/bodnar/.claude/references/bun.md#bun-create---project-templating
 */

import { $ } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";

// ============================================================================
// Basic Usage Patterns
// ============================================================================

/**
 * Create project from React component
 * Turns existing component into full development environment
 */
export const createFromReactComponent = async () => {
  // Single component file
  await $`bun create ./MyComponent.tsx`;
  
  // Component in subdirectory
  await $`bun create ./components/Button.jsx`;
  
  // With custom destination
  await $`bun create ./Header.tsx my-header-project`;
};

/**
 * Create project from npm packages
 * Uses any create-* package from npm registry
 */
export const createFromNpmPackages = async () => {
  // Popular framework templates
  await $`bun create remix`;
  await $`bun create next-app`;
  await $`bun create vite`;
  await $`bun create astro`;
  await $`bun create nuxt`;
  
  // With custom project name
  await $`bun create remix my-remix-app`;
  await $`bun create next-app my-next-project`;
  
  // Equivalent to bunx create-* commands
  // bun create remix === bunx create-remix
};

/**
 * Create project from GitHub repositories
 * Clone and configure from any public GitHub repo
 */
export const createFromGitHub = async () => {
  // Basic GitHub repo
  await $`bun create vercel/next.js my-next-app`;
  await $`bun create withastro/astro my-astro-site`;
  
  // With full GitHub URL
  await $`bun create github.com/user/repo custom-project`;
  
  // Specific branch or tag
  await $`bun create user/repo#develop my-project`;
  await $`bun create user/repo#v2.0.0 my-project`;
  
  // Private repositories (requires GITHUB_TOKEN)
  process.env.GITHUB_TOKEN = "ghp_your_token_here";
  await $`bun create private-org/private-repo my-private-project`;
};

/**
 * Create project from local templates
 * Use custom templates stored locally
 */
export const createFromLocalTemplates = async () => {
  // Global template directory: $HOME/.bun-create/
  await $`bun create my-custom-template ./new-project`;
  
  // Project-local template: <project-root>/.bun-create/
  await $`bun create local-template ./project-from-local`;
  
  // Check if local template exists
  const globalTemplatePath = join(process.env.HOME!, '.bun-create', 'my-template');
  if (existsSync(globalTemplatePath)) {
    await $`bun create my-template ./project-from-global`;
  }
};

// ============================================================================
// CLI Options and Flags
// ============================================================================

/**
 * Essential CLI flags for bun create
 */
export const cliFlags = async () => {
  // Force overwrite existing files
  await $`bun create template-name --force`;
  
  // Skip dependency installation
  await $`bun create template-name --no-install`;
  
  // Skip git repository initialization
  await $`bun create template-name --no-git`;
  
  // Start dev server and open in browser after creation
  await $`bun create template-name --open`;
  
  // Combine multiple options
  await $`bun create my-template --force --no-git --open`;
  
  // Specify custom destination directory
  await $`bun create template-name custom-directory`;
  
  // Quiet mode (minimal output)
  await $`bun create template-name --quiet`;
};

/**
 * Advanced usage with environment variables
 */
export const environmentVariables = async () => {
  // GitHub authentication for private repos
  process.env.GITHUB_TOKEN = "ghp_your_personal_access_token";
  
  // Custom GitHub domain (GitHub Enterprise)
  process.env.GITHUB_API_DOMAIN = "github.company.com";
  
  // Override default template directory
  process.env.BUN_CREATE_DIR = "/custom/template/path";
  
  // Set default project author
  process.env.BUN_CREATE_AUTHOR = "Your Name";
  
  // Create with environment variables
  await $`bun create private-org/enterprise-template my-enterprise-app`;
};

// ============================================================================
// Template Configuration Examples
// ============================================================================

/**
 * Example package.json configuration for templates
 */
export const packageJsonTemplate = {
  name: "my-custom-template",
  version: "1.0.0",
  description: "Custom Bun template with TypeScript and Effect-TS",
  "bun-create": {
    // Pre-installation script
    preinstall: "echo 'Setting up custom template...'",
    
    // Post-installation scripts (array for multiple commands)
    postinstall: [
      "echo 'Template created successfully!'",
      "echo 'Installing dependencies...'",
      "bun install",
      "echo 'Run: bun run dev to start development'"
    ],
    
    // Custom start command
    start: "bun run dev"
  },
  scripts: {
    dev: "bun --hot src/index.ts",
    build: "bun build src/index.ts --outdir dist",
    test: "bun test",
    lint: "bunx biome check --write ."
  },
  dependencies: {
    "effect": "latest",
    "@effect/platform-bun": "latest"
  },
  devDependencies: {
    "@types/bun": "latest",
    "@biomejs/biome": "latest",
    "typescript": "latest"
  }
};

/**
 * Advanced template configuration with interactive prompts
 */
export const bunCreateConfig = {
  // Interactive prompts for template customization
  prompts: [
    {
      name: "appName",
      message: "What is your application name?",
      default: "my-app"
    },
    {
      name: "useTypeScript",
      type: "confirm",
      message: "Use TypeScript?",
      default: true
    },
    {
      name: "useEffectTS",
      type: "confirm",
      message: "Use Effect-TS for functional programming?",
      default: true
    },
    {
      name: "framework",
      type: "list",
      message: "Choose a framework:",
      choices: ["astro", "vue", "hono", "none"],
      default: "astro"
    },
    {
      name: "styling",
      type: "list",
      message: "Choose styling solution:",
      choices: ["tailwindcss", "shadcn-vue", "none"],
      default: "tailwindcss"
    }
  ],
  
  // Template actions based on user responses
  actions: [
    {
      type: "add",
      path: "src/{{appName}}.{{#if useTypeScript}}ts{{else}}js{{/if}}",
      templateFile: "templates/main.hbs"
    },
    {
      type: "add",
      path: "package.json",
      templateFile: "templates/package.json.hbs"
    },
    {
      type: "addMany",
      destination: "src/components/",
      base: "templates/components/",
      templateFiles: "templates/components/**/*.hbs"
    },
    {
      type: "modify",
      path: "tsconfig.json",
      pattern: /"strict": false/g,
      template: '"strict": true'
    }
  ],
  
  // Conditional file inclusion
  filters: {
    "src/**/*.ts": "useTypeScript",
    "src/**/*.js": "!useTypeScript",
    "effect/**/*": "useEffectTS",
    "astro.config.*": "framework === 'astro'",
    "vue.config.*": "framework === 'vue'",
    "tailwind.config.*": "styling === 'tailwindcss'"
  }
};

// ============================================================================
// Framework-Specific Templates
// ============================================================================

/**
 * React and Next.js templates
 */
export const reactTemplates = async () => {
  // Next.js with App Router
  await $`bun create next-app my-next-app --typescript --tailwind --app`;
  
  // React with Vite
  await $`bun create vite my-react-app --template react-ts`;
  
  // React with custom template
  await $`bun create vercel/next.js/examples/with-tailwindcss tailwind-app`;
  
  // Remix application
  await $`bun create remix my-remix-app --typescript`;
};

/**
 * Vue and Nuxt templates
 */
export const vueTemplates = async () => {
  // Nuxt 3 application
  await $`bun create nuxt my-nuxt-app`;
  
  // Vue 3 with Vite
  await $`bun create vite my-vue-app --template vue-ts`;
  
  // Vue with custom composition
  await $`bun create vue/create-vue my-vue-project`;
};

/**
 * Astro templates
 */
export const astroTemplates = async () => {
  // Basic Astro site
  await $`bun create astro my-astro-site`;
  
  // Astro with specific template
  await $`bun create astro my-blog --template blog`;
  await $`bun create astro my-portfolio --template portfolio`;
  
  // Astro from GitHub examples
  await $`bun create withastro/astro/examples/blog astro-blog`;
};

/**
 * API and backend templates
 */
export const backendTemplates = async () => {
  // Hono API template
  await $`bun create hono my-api`;
  
  // Express-like API (avoid in favor of Hono)
  // await $`bun create express-api my-express-api`;
  
  // Effect-TS backend template (custom)
  await $`bun create my-org/effect-ts-api my-effect-api`;
  
  // Microservice template
  await $`bun create my-company/microservice-template user-service`;
};

// ============================================================================
// Custom Template Creation
// ============================================================================

/**
 * Create a custom template structure
 */
export const createCustomTemplate = async () => {
  const templatePath = "/tmp/my-custom-template";
  
  // Create template directory structure
  await $`mkdir -p ${templatePath}/template/src/components`;
  await $`mkdir -p ${templatePath}/template/public`;
  await $`mkdir -p ${templatePath}/template/tests`;
  
  // Create template files with variables
  const mainTemplate = `
// {{APP_NAME}} - Main Entry Point
// Generated on {{DATE}}
// Author: {{AUTHOR}}

import { Effect, Console } from "effect";

const program = Effect.gen(function* () {
  yield* Console.log("Hello from {{APP_NAME}}!");
  return "{{APP_NAME}} started successfully";
});

// Run the program
Effect.runPromise(program);
`;
  
  await Bun.write(`${templatePath}/template/src/index.ts`, mainTemplate);
  
  // Create package.json template
  const packageTemplate = {
    name: "{{APP_NAME}}",
    version: "1.0.0",
    description: "{{DESCRIPTION}}",
    main: "src/index.ts",
    scripts: {
      dev: "bun --hot src/index.ts",
      build: "bun build src/index.ts --outdir dist",
      test: "bun test",
      lint: "bunx biome check --write ."
    },
    dependencies: {
      effect: "latest"
    },
    devDependencies: {
      "@types/bun": "latest",
      "@biomejs/biome": "latest",
      typescript: "latest"
    }
  };
  
  await Bun.write(
    `${templatePath}/template/package.json`, 
    JSON.stringify(packageTemplate, null, 2)
  );
  
  // Create template configuration
  const templateConfig = {
    "bun-create": {
      preinstall: "echo 'Creating {{APP_NAME}}...'",
      postinstall: [
        "echo 'Template created successfully!'",
        "echo 'Run: bun run dev to start development'"
      ]
    }
  };
  
  await Bun.write(
    `${templatePath}/package.json`,
    JSON.stringify(templateConfig, null, 2)
  );
  
  // Create README template
  const readmeTemplate = `
# {{APP_NAME}}

{{DESCRIPTION}}

## Getting Started

\`\`\`bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Run tests
bun test
\`\`\`

## Features

- ⚡ Bun runtime for maximum performance
- 🎯 Effect-TS for functional programming
- 🔧 TypeScript for type safety
- 🧪 Built-in testing with bun:test
- 📦 Zero-config bundling

Generated by {{AUTHOR}} on {{DATE}}
`;
  
  await Bun.write(`${templatePath}/template/README.md`, readmeTemplate);
  
  console.log(`Custom template created at: ${templatePath}`);
  console.log(`Install globally: cp -r ${templatePath} ~/.bun-create/my-template`);
};

/**
 * Advanced template with conditional files and interactive setup
 */
export const advancedTemplateSetup = async () => {
  const configPath = "/tmp/advanced-template/bun-create.config.js";
  
  const advancedConfig = `
module.exports = {
  // Interactive prompts
  prompts: [
    {
      name: 'appName',
      message: 'Application name:',
      default: 'my-app',
      validate: (input) => input.length > 0 || 'App name is required'
    },
    {
      name: 'useTypeScript',
      type: 'confirm',
      message: 'Use TypeScript?',
      default: true
    },
    {
      name: 'useEffectTS',
      type: 'confirm',
      message: 'Use Effect-TS for functional programming?',
      default: true,
      when: (answers) => answers.useTypeScript
    },
    {
      name: 'framework',
      type: 'list',
      message: 'Choose framework:',
      choices: [
        { name: 'Astro (Static Site)', value: 'astro' },
        { name: 'Hono (API Server)', value: 'hono' },
        { name: 'Vue 3 (SPA)', value: 'vue' },
        { name: 'None (Vanilla)', value: 'none' }
      ],
      default: 'astro'
    },
    {
      name: 'styling',
      type: 'list',
      message: 'Styling solution:',
      choices: ['tailwindcss', 'shadcn-vue', 'vanilla-css', 'none'],
      default: 'tailwindcss',
      when: (answers) => answers.framework !== 'hono'
    },
    {
      name: 'database',
      type: 'list',
      message: 'Database integration:',
      choices: ['sqlite', 'postgresql', 'none'],
      default: 'sqlite'
    },
    {
      name: 'testing',
      type: 'confirm',
      message: 'Include testing setup?',
      default: true
    }
  ],
  
  // Template actions
  actions: [
    // Base files
    {
      type: 'add',
      path: 'src/index.{{#if useTypeScript}}ts{{else}}js{{/if}}',
      templateFile: 'templates/index.hbs'
    },
    {
      type: 'add',
      path: 'package.json',
      templateFile: 'templates/package.json.hbs'
    },
    {
      type: 'add',
      path: 'README.md',
      templateFile: 'templates/README.md.hbs'
    },
    
    // TypeScript configuration
    {
      type: 'add',
      path: 'tsconfig.json',
      templateFile: 'templates/tsconfig.json.hbs',
      skip: '!useTypeScript'
    },
    
    // Framework-specific files
    {
      type: 'add',
      path: 'astro.config.mjs',
      templateFile: 'templates/astro.config.mjs.hbs',
      skip: 'framework !== "astro"'
    },
    {
      type: 'add',
      path: 'src/server.{{#if useTypeScript}}ts{{else}}js{{/if}}',
      templateFile: 'templates/hono-server.hbs',
      skip: 'framework !== "hono"'
    },
    {
      type: 'add',
      path: 'vue.config.js',
      templateFile: 'templates/vue.config.js.hbs',
      skip: 'framework !== "vue"'
    },
    
    // Styling files
    {
      type: 'add',
      path: 'tailwind.config.js',
      templateFile: 'templates/tailwind.config.js.hbs',
      skip: 'styling !== "tailwindcss"'
    },
    {
      type: 'add',
      path: 'src/styles/globals.css',
      templateFile: 'templates/globals.css.hbs',
      skip: 'styling === "none"'
    },
    
    // Database files
    {
      type: 'add',
      path: 'src/db/schema.{{#if useTypeScript}}ts{{else}}js{{/if}}',
      templateFile: 'templates/db-schema.hbs',
      skip: 'database === "none"'
    },
    
    // Testing files
    {
      type: 'addMany',
      destination: 'tests/',
      base: 'templates/tests/',
      templateFiles: 'templates/tests/**/*.hbs',
      skip: '!testing'
    },
    
    // Effect-TS specific files
    {
      type: 'add',
      path: 'src/effects/{{dashCase appName}}.{{#if useTypeScript}}ts{{else}}js{{/if}}',
      templateFile: 'templates/effect-main.hbs',
      skip: '!useEffectTS'
    }
  ],
  
  // Post-generation hooks
  postActions: [
    {
      type: 'install-deps',
      message: 'Installing dependencies...'
    },
    {
      type: 'run-script',
      script: 'lint',
      message: 'Running initial linting...'
    },
    {
      type: 'git-init',
      message: 'Initializing git repository...'
    }
  ]
};
`;
  
  await Bun.write(configPath, advancedConfig);
  console.log(`Advanced template config created at: ${configPath}`);
};

// ============================================================================
// Performance and Optimization
// ============================================================================

/**
 * Template caching and performance optimization
 */
export const templatePerformance = async () => {
  // Check template cache
  const cacheDir = join(process.env.HOME!, '.bun', 'cache', 'create');
  console.log(`Template cache directory: ${cacheDir}`);
  
  // Clear template cache if needed
  if (existsSync(cacheDir)) {
    await $`rm -rf ${cacheDir}`;
    console.log('Template cache cleared');
  }
  
  // Parallel template creation (be careful with rate limits)
  const templates = [
    'astro',
    'vite',
    'nuxt'
  ];
  
  const projects = await Promise.all(
    templates.map(async (template, index) => {
      const projectName = `project-${template}-${index}`;
      await $`bun create ${template} ${projectName} --no-git --no-install`;
      return projectName;
    })
  );
  
  console.log('Created projects:', projects);
  
  // Cleanup
  await Promise.all(
    projects.map(project => $`rm -rf ${project}`)
  );
};

/**
 * Bundle optimization for templates
 */
export const bundleOptimization = async () => {
  // Create optimized template with tree shaking
  const optimizedTemplate = {
    name: "optimized-template",
    "bun-create": {
      postinstall: [
        "echo 'Optimizing bundle...'",
        "bun build src/index.ts --minify --target browser --outdir dist",
        "echo 'Bundle optimization complete'"
      ]
    },
    dependencies: {
      // Only essential dependencies
      "effect": "latest"
    },
    devDependencies: {
      "@types/bun": "latest",
      "@biomejs/biome": "latest",
      "typescript": "latest"
    }
  };
  
  await Bun.write(
    "/tmp/optimized-template.json",
    JSON.stringify(optimizedTemplate, null, 2)
  );
  
  console.log('Optimized template configuration created');
};

// ============================================================================
// Error Handling and Validation
// ============================================================================

/**
 * Error handling for template creation
 */
export const errorHandling = async () => {
  try {
    // Template creation with validation
    const templateName = "my-template";
    const projectName = "my-project";
    
    // Check if template exists
    const templateExists = await $`bun create ${templateName} --dry-run`.nothrow();
    
    if (templateExists.exitCode !== 0) {
      console.error(`Template '${templateName}' not found`);
      return;
    }
    
    // Check if destination exists
    if (existsSync(projectName)) {
      console.log(`Directory '${projectName}' exists, using --force`);
      await $`bun create ${templateName} ${projectName} --force`;
    } else {
      await $`bun create ${templateName} ${projectName}`;
    }
    
    console.log(`Project '${projectName}' created successfully`);
    
  } catch (error) {
    console.error('Template creation failed:', error);
    
    // Common error scenarios
    if (error.message.includes('ENOTFOUND')) {
      console.error('Network error: Check internet connection');
    } else if (error.message.includes('EACCES')) {
      console.error('Permission error: Check file permissions');
    } else if (error.message.includes('ENOSPC')) {
      console.error('Disk space error: Free up disk space');
    }
  }
};

/**
 * Template validation and testing
 */
export const templateValidation = async () => {
  const templatePath = "/tmp/test-template";
  
  // Create test template
  await createCustomTemplate();
  
  // Validate template structure
  const requiredFiles = [
    'package.json',
    'template/src/index.ts',
    'template/package.json'
  ];
  
  for (const file of requiredFiles) {
    const filePath = join(templatePath, file);
    if (!existsSync(filePath)) {
      console.error(`Missing required file: ${file}`);
      return false;
    }
  }
  
  // Test template creation
  try {
    await $`bun create ${templatePath} test-project --no-install`;
    
    // Validate created project
    const projectFiles = [
      'test-project/package.json',
      'test-project/src/index.ts'
    ];
    
    for (const file of projectFiles) {
      if (!existsSync(file)) {
        console.error(`Template failed to create: ${file}`);
        return false;
      }
    }
    
    console.log('Template validation successful');
    
    // Cleanup
    await $`rm -rf test-project`;
    
    return true;
    
  } catch (error) {
    console.error('Template validation failed:', error);
    return false;
  }
};

// ============================================================================
// Integration Examples
// ============================================================================

/**
 * Integration with CI/CD pipelines
 */
export const cicdIntegration = async () => {
  // GitHub Actions workflow for template testing
  const githubWorkflow = `
name: Test Template

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-template:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Test template creation
        run: |
          bun create . test-project --no-git --no-install
          cd test-project
          bun install
          bun run build
          bun test
      
      - name: Cleanup
        run: rm -rf test-project
`;
  
  await Bun.write("/tmp/template-ci.yml", githubWorkflow);
  console.log('CI/CD workflow created for template testing');
};

/**
 * Docker integration for templates
 */
export const dockerIntegration = async () => {
  // Dockerfile template for Bun projects
  const dockerfile = `
FROM oven/bun:latest as base

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN bun run build

# Production stage
FROM oven/bun:alpine as production

WORKDIR /app

# Copy built application
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./

# Install production dependencies only
RUN bun install --production --frozen-lockfile

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start application
CMD ["bun", "run", "dist/index.js"]
`;
  
  await Bun.write("/tmp/Dockerfile.template", dockerfile);
  console.log('Docker template created for Bun projects');
};

// Export all examples
export {
  createFromReactComponent,
  createFromNpmPackages,
  createFromGitHub,
  createFromLocalTemplates,
  cliFlags,
  environmentVariables,
  packageJsonTemplate,
  bunCreateConfig,
  reactTemplates,
  vueTemplates,
  astroTemplates,
  backendTemplates,
  createCustomTemplate,
  advancedTemplateSetup,
  templatePerformance,
  bundleOptimization,
  errorHandling,
  templateValidation,
  cicdIntegration,
  dockerIntegration
};

// Usage examples
if (import.meta.main) {
  console.log("🚀 Bun Create Examples");
  console.log("Run individual functions to test template creation patterns");
  
  // Example usage
  // await createFromNpmPackages();
  // await createCustomTemplate();
  // await templateValidation();
}