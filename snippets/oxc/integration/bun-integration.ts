// Bun integration with Oxc tools

import { transform } from 'oxc-transform';
import { plugin } from 'bun';

/**
 * Bun build plugin for oxc-transform
 */
export const oxcTransformPlugin = plugin({
  name: 'oxc-transform',
  setup(build) {
    // Transform TypeScript files
    build.onLoad({ filter: /\.tsx?$/ }, async (args) => {
      const source = await Bun.file(args.path).text();
      
      try {
        const result = transform(args.path, source, {
          typescript: {
            onlyRemoveTypeImports: true,
            declaration: false // Skip declarations in build
          },
          jsx: args.path.endsWith('x') ? {
            plugin: 'react',
            development: process.env.NODE_ENV === 'development'
          } : undefined
        });

        return {
          contents: result.code,
          loader: 'js'
        };
      } catch (error) {
        console.error(`Transform failed for ${args.path}:`, error);
        throw error;
      }
    });

    // Handle JSX files
    build.onLoad({ filter: /\.jsx$/ }, async (args) => {
      const source = await Bun.file(args.path).text();
      
      const result = transform(args.path, source, {
        jsx: {
          plugin: 'react',
          development: process.env.NODE_ENV === 'development',
          refresh: process.env.NODE_ENV === 'development' ? {
            refreshReg: '$RefreshReg$',
            refreshSig: '$RefreshSig$'
          } : undefined
        }
      });

      return {
        contents: result.code,
        loader: 'js'
      };
    });
  }
});

/**
 * Bun build configuration with oxc
 */
export const bunBuildConfig = {
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm' as const,
  splitting: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: 'external' as const,
  plugins: [oxcTransformPlugin]
};

/**
 * Build script using Bun with oxc
 */
export const buildProject = async () => {
  console.log('Building project with Bun + Oxc...');
  
  const result = await Bun.build(bunBuildConfig);
  
  if (!result.success) {
    console.error('Build failed:', result.logs);
    process.exit(1);
  }
  
  console.log('Build completed successfully!');
  console.log(`Generated ${result.outputs.length} files`);
  
  return result;
};

/**
 * Development server with hot reload and oxc transforms
 */
export const devServer = async (port = 3000) => {
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      
      // Serve TypeScript files with transformation
      if (url.pathname.endsWith('.ts') || url.pathname.endsWith('.tsx')) {
        const filePath = `./src${url.pathname}`;
        
        try {
          const source = await Bun.file(filePath).text();
          const result = transform(filePath, source, {
            typescript: { declaration: false },
            jsx: filePath.endsWith('x') ? {
              plugin: 'react',
              development: true,
              refresh: {
                refreshReg: '$RefreshReg$',
                refreshSig: '$RefreshSig$'
              }
            } : undefined
          });
          
          return new Response(result.code, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        } catch (error) {
          return new Response(`Error: ${error.message}`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }
      
      // Serve static files
      return new Response(Bun.file(`./public${url.pathname}`));
    }
  });
  
  console.log(`Development server running on http://localhost:${port}`);
  return server;
};

/**
 * Lint and format integration with Bun scripts
 */
export const qualityCheck = async () => {
  console.log('Running quality checks...');
  
  // Run oxlint
  const lintResult = Bun.spawnSync(['oxlint'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  if (!lintResult.success) {
    console.error('Linting failed:', lintResult.stderr.toString());
    return false;
  }
  
  // Run prettier check
  const formatResult = Bun.spawnSync(['prettier', '--check', '.'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  if (!formatResult.success) {
    console.error('Formatting check failed:', formatResult.stderr.toString());
    return false;
  }
  
  console.log('All quality checks passed!');
  return true;
};

/**
 * Test setup with oxc transformations
 */
export const testSetup = () => {
  // Configure Bun test to use oxc transforms
  process.env.BUN_CONFIG_OVERRIDE = JSON.stringify({
    preload: ['./test-setup.ts'],
    loader: {
      '.ts': 'tsx',
      '.tsx': 'tsx'
    }
  });
};

// Usage examples
if (import.meta.main) {
  const command = process.argv[2];
  
  switch (command) {
    case 'build':
      await buildProject();
      break;
    case 'dev':
      await devServer();
      break;
    case 'check':
      const passed = await qualityCheck();
      process.exit(passed ? 0 : 1);
    default:
      console.log('Available commands: build, dev, check');
  }
}