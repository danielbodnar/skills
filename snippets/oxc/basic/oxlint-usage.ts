// Basic oxlint usage examples

import { execSync } from 'node:child_process';

/**
 * Run oxlint programmatically
 */
export const runOxlint = (options: {
  path?: string;
  config?: string;
  fix?: boolean;
  allowWarnings?: boolean;
}) => {
  const { path = '.', config, fix, allowWarnings } = options;
  
  let command = 'oxlint';
  
  if (config) {
    command += ` --config ${config}`;
  }
  
  if (fix) {
    command += ' --fix';
  }
  
  if (allowWarnings) {
    command += ' --allow-warnings';
  }
  
  command += ` ${path}`;
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Example usage in a build script
 */
export const lintProject = async () => {
  console.log('Running oxlint...');
  
  const result = runOxlint({
    path: 'src/',
    config: '.oxlintrc.json',
    fix: true
  });
  
  if (!result.success) {
    console.error('Linting failed:', result.error);
    process.exit(1);
  }
  
  console.log('Linting completed successfully');
  return result.output;
};

/**
 * Lint specific file patterns
 */
export const lintFilePatterns = () => {
  // Lint only TypeScript files
  runOxlint({ path: 'src/**/*.ts' });
  
  // Lint only test files
  runOxlint({ path: '**/*.test.{js,ts}' });
  
  // Lint Vue single-file components
  runOxlint({ path: 'src/**/*.vue' });
};

/**
 * Integration with package.json scripts
 */
export const packageJsonScripts = {
  scripts: {
    'lint': 'oxlint',
    'lint:fix': 'oxlint --fix',
    'lint:src': 'oxlint src/',
    'lint:check': 'oxlint --quiet'
  }
};

// CLI usage examples (as comments):
// npx oxlint                          # Lint current directory
// npx oxlint src/                     # Lint src directory
// npx oxlint --fix                    # Auto-fix issues
// npx oxlint --config custom.json    # Use custom config
// npx oxlint --quiet                  # Only show errors
// npx oxlint --max-warnings 0        # Treat warnings as errors