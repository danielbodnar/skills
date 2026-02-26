/**
 * CLAUDE.md Context Management for CLI Agents
 * 
 * This example demonstrates how to implement dynamic CLAUDE.md context
 * management for terminal-based CLI agents, following Anthropic's best practices.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';

interface ClaudeContext {
  projectInstructions: string;
  codeStyle: string;
  buildCommands: string;
  references: string;
  workflowRules: string;
  customCommands: string[];
  toolPermissions: string[];
  lastUpdated: Date;
}

class ClaudeMdManager {
  private projectRoot: string;
  private claudeDir: string;
  private claudeMdPath: string;
  private referencesDir: string;
  private commandsDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.claudeDir = join(projectRoot, '.claude');
    this.claudeMdPath = join(this.claudeDir, 'CLAUDE.md');
    this.referencesDir = join(this.claudeDir, 'references');
    this.commandsDir = join(this.claudeDir, 'commands');
  }

  /**
   * Initialize CLAUDE.md with project-specific context
   */
  initialize(config: Partial<ClaudeContext>): void {
    const context = this.buildBaseContext(config);
    this.writeClaudeMd(context);
    this.createDirectoryStructure();
  }

  /**
   * Update CLAUDE.md with new context information
   */
  updateContext(updates: Partial<ClaudeContext>): void {
    const currentContext = this.loadCurrentContext();
    const mergedContext = { ...currentContext, ...updates };
    this.writeClaudeMd(mergedContext);
  }

  /**
   * Add workflow-specific instructions
   */
  addWorkflowInstructions(workflow: string, instructions: string): void {
    const context = this.loadCurrentContext();
    context.workflowRules += `\n\n## ${workflow}\n${instructions}`;
    this.writeClaudeMd(context);
  }

  /**
   * Add custom slash command
   */
  addCustomCommand(commandName: string, description: string, implementation: string): void {
    const commandPath = join(this.commandsDir, `${commandName}.md`);
    const commandContent = `# ${commandName}

${description}

## Implementation

${implementation}

## Usage

\`/${commandName} [parameters]\`
`;
    
    writeFileSync(commandPath, commandContent);
    
    // Update CLAUDE.md to reference the new command
    const context = this.loadCurrentContext();
    if (!context.customCommands.includes(commandName)) {
      context.customCommands.push(commandName);
      this.writeClaudeMd(context);
    }
  }

  /**
   * Add reference documentation
   */
  addReference(library: string, documentation: string): void {
    const referencePath = join(this.referencesDir, `${library}.md`);
    writeFileSync(referencePath, documentation);
    
    // Update CLAUDE.md references section
    const context = this.loadCurrentContext();
    context.references += `\n- **${library}**: \`@${referencePath}\``;
    this.writeClaudeMd(context);
  }

  /**
   * Auto-detect project configuration and update context
   */
  autoDetectProject(): void {
    const projectConfig = this.detectProjectConfiguration();
    this.updateContext({
      projectInstructions: this.generateProjectInstructions(projectConfig),
      codeStyle: this.generateCodeStyleRules(projectConfig),
      buildCommands: this.generateBuildCommands(projectConfig)
    });
  }

  /**
   * Generate context-aware instructions based on recent git activity
   */
  generateContextFromGitHistory(): string {
    try {
      const recentCommits = execSync('git log --oneline -10', { 
        encoding: 'utf-8',
        cwd: this.projectRoot 
      });
      
      const recentFiles = execSync('git diff --name-only HEAD~5..HEAD', { 
        encoding: 'utf-8',
        cwd: this.projectRoot 
      });

      return `## Recent Development Context

### Recent Commits
${recentCommits}

### Recently Modified Files
${recentFiles}

### Development Guidelines
- Follow established patterns from recent commits
- Maintain consistency with recently modified files
- Consider impact on related components
`;
    } catch (error) {
      return '## Recent Development Context\n\nNo git history available.';
    }
  }

  /**
   * Create dynamic context based on current task
   */
  createTaskContext(task: string, additionalContext?: Record<string, any>): string {
    const baseContext = this.loadCurrentContext();
    const gitContext = this.generateContextFromGitHistory();
    
    return `# Task-Specific Context

## Current Task
${task}

## Project Context
${baseContext.projectInstructions}

## Code Style Guidelines
${baseContext.codeStyle}

## Build Commands
${baseContext.buildCommands}

${gitContext}

${additionalContext ? `## Additional Context\n${JSON.stringify(additionalContext, null, 2)}` : ''}

## References
${baseContext.references}
`;
  }

  /**
   * Create context for specific file types
   */
  createFileTypeContext(fileExtension: string): string {
    const fileTypeRules = this.getFileTypeRules(fileExtension);
    const relevantReferences = this.getRelevantReferences(fileExtension);
    
    return `## File Type Context: ${fileExtension}

### Specific Rules
${fileTypeRules}

### Relevant References
${relevantReferences}

### Best Practices
- Follow established patterns for ${fileExtension} files
- Use appropriate tooling and linting rules
- Consider performance and maintainability
`;
  }

  /**
   * Create context for debugging sessions
   */
  createDebugContext(errorType: string, stackTrace?: string): string {
    return `## Debug Context

### Error Type
${errorType}

### Stack Trace
${stackTrace || 'No stack trace available'}

### Debugging Guidelines
- Identify root cause before implementing fixes
- Add appropriate logging and error handling
- Consider edge cases and error scenarios
- Test fixes thoroughly before committing

### Debugging Tools
- Use project-specific debugging tools
- Check logs and monitoring systems
- Verify test coverage for affected areas
`;
  }

  /**
   * Load current CLAUDE.md context
   */
  private loadCurrentContext(): ClaudeContext {
    if (!existsSync(this.claudeMdPath)) {
      return this.buildBaseContext({});
    }

    const content = readFileSync(this.claudeMdPath, 'utf-8');
    return this.parseClaudeContent(content);
  }

  /**
   * Write CLAUDE.md file
   */
  private writeClaudeMd(context: ClaudeContext): void {
    const content = this.formatClaudeContent(context);
    writeFileSync(this.claudeMdPath, content);
  }

  /**
   * Build base context structure
   */
  private buildBaseContext(config: Partial<ClaudeContext>): ClaudeContext {
    return {
      projectInstructions: config.projectInstructions || this.getDefaultProjectInstructions(),
      codeStyle: config.codeStyle || this.getDefaultCodeStyle(),
      buildCommands: config.buildCommands || this.getDefaultBuildCommands(),
      references: config.references || this.getDefaultReferences(),
      workflowRules: config.workflowRules || this.getDefaultWorkflowRules(),
      customCommands: config.customCommands || [],
      toolPermissions: config.toolPermissions || [],
      lastUpdated: new Date()
    };
  }

  /**
   * Format context as CLAUDE.md content
   */
  private formatClaudeContent(context: ClaudeContext): string {
    return `# CLAUDE.md

This file provides context and instructions for Claude Code when working with this project.

## Project Instructions
${context.projectInstructions}

## Code Style Guidelines
${context.codeStyle}

## Build Commands
${context.buildCommands}

## Workflow Rules
${context.workflowRules}

## Custom Commands
${context.customCommands.map(cmd => `- \`/${cmd}\``).join('\n')}

## Tool Permissions
${context.toolPermissions.map(perm => `- ${perm}`).join('\n')}

## References
${context.references}

---
*Last updated: ${context.lastUpdated.toISOString()}*
`;
  }

  /**
   * Parse existing CLAUDE.md content
   */
  private parseClaudeContent(content: string): ClaudeContext {
    // Simplified parsing - in practice, use proper markdown parser
    const sections = content.split('## ');
    
    return {
      projectInstructions: this.extractSection(sections, 'Project Instructions'),
      codeStyle: this.extractSection(sections, 'Code Style Guidelines'),
      buildCommands: this.extractSection(sections, 'Build Commands'),
      references: this.extractSection(sections, 'References'),
      workflowRules: this.extractSection(sections, 'Workflow Rules'),
      customCommands: this.extractCommandList(sections, 'Custom Commands'),
      toolPermissions: this.extractPermissionList(sections, 'Tool Permissions'),
      lastUpdated: new Date()
    };
  }

  /**
   * Extract section content from markdown
   */
  private extractSection(sections: string[], sectionName: string): string {
    const section = sections.find(s => s.startsWith(sectionName));
    return section ? section.substring(sectionName.length).trim() : '';
  }

  /**
   * Extract command list from markdown
   */
  private extractCommandList(sections: string[], sectionName: string): string[] {
    const section = this.extractSection(sections, sectionName);
    return section
      .split('\n')
      .filter(line => line.startsWith('- `'))
      .map(line => line.replace(/^- `\/([^`]+)`.*/, '$1'));
  }

  /**
   * Extract permission list from markdown
   */
  private extractPermissionList(sections: string[], sectionName: string): string[] {
    const section = this.extractSection(sections, sectionName);
    return section
      .split('\n')
      .filter(line => line.startsWith('- '))
      .map(line => line.substring(2).trim());
  }

  /**
   * Detect project configuration
   */
  private detectProjectConfiguration(): Record<string, any> {
    const config: Record<string, any> = {};
    
    // Check for package.json
    if (existsSync(join(this.projectRoot, 'package.json'))) {
      const packageJson = JSON.parse(
        readFileSync(join(this.projectRoot, 'package.json'), 'utf-8')
      );
      config.packageManager = existsSync(join(this.projectRoot, 'bun.lockb')) ? 'bun' : 'npm';
      config.dependencies = packageJson.dependencies || {};
      config.devDependencies = packageJson.devDependencies || {};
      config.scripts = packageJson.scripts || {};
    }
    
    // Check for TypeScript
    config.typescript = existsSync(join(this.projectRoot, 'tsconfig.json'));
    
    // Check for testing framework
    config.testing = this.detectTestingFramework();
    
    // Check for linting
    config.linting = this.detectLintingTools();
    
    return config;
  }

  /**
   * Detect testing framework
   */
  private detectTestingFramework(): string {
    if (existsSync(join(this.projectRoot, 'vitest.config.ts'))) return 'vitest';
    if (existsSync(join(this.projectRoot, 'jest.config.js'))) return 'jest';
    return 'none';
  }

  /**
   * Detect linting tools
   */
  private detectLintingTools(): string[] {
    const tools: string[] = [];
    if (existsSync(join(this.projectRoot, 'biome.json'))) tools.push('biome');
    if (existsSync(join(this.projectRoot, '.eslintrc.js'))) tools.push('eslint');
    if (existsSync(join(this.projectRoot, 'prettier.config.js'))) tools.push('prettier');
    return tools;
  }

  /**
   * Generate project instructions based on config
   */
  private generateProjectInstructions(config: Record<string, any>): string {
    return `This is a ${config.typescript ? 'TypeScript' : 'JavaScript'} project using ${config.packageManager || 'npm'}.

### Key Technologies
${Object.keys(config.dependencies || {}).map(dep => `- ${dep}`).join('\n')}

### Development Guidelines
- Use ${config.packageManager || 'npm'} for package management
- Follow ${config.typescript ? 'TypeScript' : 'JavaScript'} best practices
- Write tests using ${config.testing} framework
- Use ${config.linting.join(', ')} for code quality
`;
  }

  /**
   * Generate code style rules
   */
  private generateCodeStyleRules(config: Record<string, any>): string {
    return `- ${config.typescript ? 'TypeScript with strict mode' : 'JavaScript ES2024+'}
- Use functional programming patterns
- Prefer async/await over promises
- Use proper error handling
- Follow established naming conventions
- ${config.linting.includes('biome') ? 'Use Biome for formatting' : 'Use Prettier for formatting'}
`;
  }

  /**
   * Generate build commands
   */
  private generateBuildCommands(config: Record<string, any>): string {
    const scripts = config.scripts || {};
    const commands = [];
    
    if (scripts.dev) commands.push(`- \`${config.packageManager} run dev\` - Development server`);
    if (scripts.build) commands.push(`- \`${config.packageManager} run build\` - Production build`);
    if (scripts.test) commands.push(`- \`${config.packageManager} run test\` - Run tests`);
    if (config.linting.includes('biome')) {
      commands.push(`- \`bunx biome check\` - Lint and type check`);
      commands.push(`- \`bunx biome check --write\` - Fix linting issues`);
    }
    
    return commands.join('\n');
  }

  /**
   * Default methods for base context
   */
  private getDefaultProjectInstructions(): string {
    return 'This project follows modern development practices with TypeScript and Bun.';
  }

  private getDefaultCodeStyle(): string {
    return '- TypeScript with strict mode\n- Functional programming patterns\n- Proper error handling';
  }

  private getDefaultBuildCommands(): string {
    return '- `bun run dev` - Development server\n- `bun run build` - Production build';
  }

  private getDefaultReferences(): string {
    return '- Check `@.claude/references/` for documentation';
  }

  private getDefaultWorkflowRules(): string {
    return '- Commit early and often\n- Write tests for new features\n- Update documentation';
  }

  private getFileTypeRules(extension: string): string {
    const rules: Record<string, string> = {
      '.ts': 'Use TypeScript with strict mode, proper types, and functional patterns',
      '.js': 'Use modern JavaScript (ES2024+) with proper error handling',
      '.vue': 'Use Vue 3 composition API with TypeScript',
      '.md': 'Use clear, concise markdown with proper formatting'
    };
    
    return rules[extension] || 'Follow general coding standards';
  }

  private getRelevantReferences(extension: string): string {
    const references: Record<string, string> = {
      '.ts': '@.claude/references/typescript.md',
      '.js': '@.claude/references/javascript.md',
      '.vue': '@.claude/references/vue.md',
      '.md': '@.claude/references/markdown.md'
    };
    
    return references[extension] || 'Check general references';
  }

  private createDirectoryStructure(): void {
    const dirs = [this.claudeDir, this.referencesDir, this.commandsDir];
    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        execSync(`mkdir -p ${dir}`);
      }
    });
  }
}

// Usage Examples
const claudeManager = new ClaudeMdManager();

// Initialize with project-specific context
claudeManager.initialize({
  projectInstructions: 'This is a Bun + TypeScript project with Hono for API routes',
  codeStyle: 'Use functional programming with proper TypeScript types',
  buildCommands: 'bun run dev, bun run build, bunx biome check'
});

// Auto-detect project and update context
claudeManager.autoDetectProject();

// Add custom command
claudeManager.addCustomCommand('deploy', 'Deploy to production', `
1. Run tests: bun test
2. Build: bun run build
3. Deploy: bun run deploy
`);

// Create task-specific context
const taskContext = claudeManager.createTaskContext('Implement user authentication', {
  requirements: ['JWT tokens', 'Password hashing', 'Session management']
});

// Create debug context
const debugContext = claudeManager.createDebugContext('TypeScript compilation error', 'Type error in auth.ts:42');

export { ClaudeMdManager, ClaudeContext };