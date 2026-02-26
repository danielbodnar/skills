/**
 * Terminal CLI Agent Workflow Context Engineering
 * 
 * This example demonstrates how to build context-aware workflows
 * for terminal-based CLI agents with dynamic context management.
 */

import { spawn, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const execAsync = promisify(exec);

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  command?: string;
  context: Record<string, any>;
  dependencies: string[];
  outputs: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

interface WorkflowContext {
  sessionId: string;
  workingDirectory: string;
  environment: Record<string, string>;
  variables: Record<string, any>;
  history: WorkflowStep[];
  currentStep?: string;
  metadata: Record<string, any>;
}

class TerminalWorkflowEngine {
  private context: WorkflowContext;
  private steps: Map<string, WorkflowStep>;
  private contextFile: string;

  constructor(sessionId: string, workingDirectory: string = process.cwd()) {
    this.context = {
      sessionId,
      workingDirectory,
      environment: { ...process.env },
      variables: {},
      history: [],
      metadata: {}
    };
    this.steps = new Map();
    this.contextFile = join(workingDirectory, '.claude', `workflow-${sessionId}.json`);
    this.loadContext();
  }

  /**
   * Define a workflow step
   */
  defineStep(step: Omit<WorkflowStep, 'status'>): void {
    const fullStep: WorkflowStep = {
      ...step,
      status: 'pending'
    };
    this.steps.set(step.id, fullStep);
    this.saveContext();
  }

  /**
   * Execute a workflow step with context
   */
  async executeStep(stepId: string): Promise<any> {
    const step = this.steps.get(stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }

    // Check dependencies
    const unmetDeps = step.dependencies.filter(dep => {
      const depStep = this.steps.get(dep);
      return !depStep || depStep.status !== 'completed';
    });

    if (unmetDeps.length > 0) {
      throw new Error(`Unmet dependencies: ${unmetDeps.join(', ')}`);
    }

    // Update step status
    step.status = 'running';
    step.startTime = new Date();
    this.context.currentStep = stepId;
    this.saveContext();

    try {
      // Build context for the step
      const stepContext = this.buildStepContext(step);
      
      // Execute the step
      const result = await this.executeStepCommand(step, stepContext);
      
      // Update step completion
      step.status = 'completed';
      step.endTime = new Date();
      step.result = result;
      
      // Update workflow variables with outputs
      this.updateWorkflowVariables(step, result);
      
      // Add to history
      this.context.history.push({ ...step });
      
      this.saveContext();
      return result;
      
    } catch (error) {
      step.status = 'failed';
      step.endTime = new Date();
      step.error = error instanceof Error ? error.message : String(error);
      this.saveContext();
      throw error;
    }
  }

  /**
   * Execute multiple steps in sequence
   */
  async executeWorkflow(stepIds: string[]): Promise<void> {
    for (const stepId of stepIds) {
      await this.executeStep(stepId);
    }
  }

  /**
   * Build context for a specific step
   */
  private buildStepContext(step: WorkflowStep): string {
    const contextParts = [
      `# Workflow Step: ${step.name}`,
      `Description: ${step.description}`,
      '',
      '## Current Environment',
      `Working Directory: ${this.context.workingDirectory}`,
      `Session ID: ${this.context.sessionId}`,
      '',
      '## Step Context',
      JSON.stringify(step.context, null, 2),
      '',
      '## Workflow Variables',
      JSON.stringify(this.context.variables, null, 2),
      '',
      '## Previous Steps',
      this.context.history.map(h => `- ${h.name} (${h.status})`).join('\n'),
      '',
      '## Dependencies',
      step.dependencies.map(dep => {
        const depStep = this.steps.get(dep);
        return `- ${dep}: ${depStep?.status || 'not found'}`;
      }).join('\n')
    ];

    return contextParts.join('\n');
  }

  /**
   * Execute step command with context
   */
  private async executeStepCommand(step: WorkflowStep, context: string): Promise<any> {
    if (!step.command) {
      return { success: true, message: 'No command to execute' };
    }

    // Replace variables in command
    const command = this.replaceVariables(step.command);
    
    // Execute command
    const { stdout, stderr } = await execAsync(command, {
      cwd: this.context.workingDirectory,
      env: this.context.environment
    });

    return {
      command,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      success: true
    };
  }

  /**
   * Replace variables in command strings
   */
  private replaceVariables(command: string): string {
    return command.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return this.context.variables[varName] || match;
    });
  }

  /**
   * Update workflow variables from step outputs
   */
  private updateWorkflowVariables(step: WorkflowStep, result: any): void {
    step.outputs.forEach(output => {
      if (result[output] !== undefined) {
        this.context.variables[output] = result[output];
      }
    });
  }

  /**
   * Set workflow variable
   */
  setVariable(name: string, value: any): void {
    this.context.variables[name] = value;
    this.saveContext();
  }

  /**
   * Get workflow variable
   */
  getVariable(name: string): any {
    return this.context.variables[name];
  }

  /**
   * Set environment variable
   */
  setEnvironment(name: string, value: string): void {
    this.context.environment[name] = value;
    this.saveContext();
  }

  /**
   * Get workflow status
   */
  getStatus(): {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    pendingSteps: number;
    currentStep?: string;
  } {
    const steps = Array.from(this.steps.values());
    return {
      totalSteps: steps.length,
      completedSteps: steps.filter(s => s.status === 'completed').length,
      failedSteps: steps.filter(s => s.status === 'failed').length,
      pendingSteps: steps.filter(s => s.status === 'pending').length,
      currentStep: this.context.currentStep
    };
  }

  /**
   * Get step execution history
   */
  getHistory(): WorkflowStep[] {
    return [...this.context.history];
  }

  /**
   * Save context to file
   */
  private saveContext(): void {
    const data = {
      context: this.context,
      steps: Array.from(this.steps.entries())
    };
    writeFileSync(this.contextFile, JSON.stringify(data, null, 2));
  }

  /**
   * Load context from file
   */
  private loadContext(): void {
    if (existsSync(this.contextFile)) {
      const data = JSON.parse(readFileSync(this.contextFile, 'utf-8'));
      this.context = data.context;
      this.steps = new Map(data.steps);
    }
  }

  /**
   * Generate workflow summary
   */
  generateSummary(): string {
    const status = this.getStatus();
    const history = this.getHistory();
    
    return `# Workflow Summary

## Session: ${this.context.sessionId}
- Total Steps: ${status.totalSteps}
- Completed: ${status.completedSteps}
- Failed: ${status.failedSteps}
- Pending: ${status.pendingSteps}

## Execution History
${history.map(step => `
### ${step.name} (${step.status})
- Started: ${step.startTime?.toISOString() || 'N/A'}
- Completed: ${step.endTime?.toISOString() || 'N/A'}
- Duration: ${step.startTime && step.endTime ? 
  `${step.endTime.getTime() - step.startTime.getTime()}ms` : 'N/A'}
${step.error ? `- Error: ${step.error}` : ''}
`).join('\n')}

## Current Variables
${Object.entries(this.context.variables).map(([key, value]) => 
  `- ${key}: ${JSON.stringify(value)}`
).join('\n')}
`;
  }
}

// Specialized workflow for development tasks
class DevelopmentWorkflow extends TerminalWorkflowEngine {
  constructor(sessionId: string, projectPath: string) {
    super(sessionId, projectPath);
    this.setupDevelopmentSteps();
  }

  /**
   * Setup common development workflow steps
   */
  private setupDevelopmentSteps(): void {
    // Code analysis step
    this.defineStep({
      id: 'analyze-code',
      name: 'Analyze Code',
      description: 'Analyze codebase for patterns and issues',
      command: 'find . -name "*.ts" -o -name "*.js" | head -20 | xargs wc -l',
      context: { 
        purpose: 'code-analysis',
        fileTypes: ['ts', 'js', 'vue']
      },
      dependencies: [],
      outputs: ['codeStats']
    });

    // Dependency check step
    this.defineStep({
      id: 'check-deps',
      name: 'Check Dependencies',
      description: 'Check and update project dependencies',
      command: 'bun install --frozen-lockfile',
      context: { 
        purpose: 'dependency-management',
        packageManager: 'bun'
      },
      dependencies: [],
      outputs: ['dependencyStatus']
    });

    // Linting step
    this.defineStep({
      id: 'lint-code',
      name: 'Lint Code',
      description: 'Run linting tools on codebase',
      command: 'bunx biome check --write',
      context: { 
        purpose: 'code-quality',
        tools: ['biome']
      },
      dependencies: ['check-deps'],
      outputs: ['lintResults']
    });

    // Test step
    this.defineStep({
      id: 'run-tests',
      name: 'Run Tests',
      description: 'Execute test suite',
      command: 'bun test',
      context: { 
        purpose: 'testing',
        framework: 'vitest'
      },
      dependencies: ['lint-code'],
      outputs: ['testResults']
    });

    // Build step
    this.defineStep({
      id: 'build-project',
      name: 'Build Project',
      description: 'Build project for production',
      command: 'bun run build',
      context: { 
        purpose: 'build',
        target: 'production'
      },
      dependencies: ['run-tests'],
      outputs: ['buildResults']
    });
  }

  /**
   * Execute full development workflow
   */
  async executeDevelopmentCycle(): Promise<void> {
    const steps = [
      'analyze-code',
      'check-deps',
      'lint-code',
      'run-tests',
      'build-project'
    ];

    await this.executeWorkflow(steps);
  }

  /**
   * Execute quick development check
   */
  async executeQuickCheck(): Promise<void> {
    const steps = [
      'check-deps',
      'lint-code',
      'run-tests'
    ];

    await this.executeWorkflow(steps);
  }
}

// Context-aware command execution
class ContextualCommand {
  private workflow: TerminalWorkflowEngine;
  private commandHistory: Array<{
    command: string;
    context: string;
    result: any;
    timestamp: Date;
  }>;

  constructor(workflow: TerminalWorkflowEngine) {
    this.workflow = workflow;
    this.commandHistory = [];
  }

  /**
   * Execute command with context awareness
   */
  async executeWithContext(command: string, context: Record<string, any>): Promise<any> {
    // Build context string
    const contextString = this.buildCommandContext(command, context);
    
    // Create dynamic step
    const stepId = `cmd-${Date.now()}`;
    this.workflow.defineStep({
      id: stepId,
      name: `Command: ${command}`,
      description: `Execute: ${command}`,
      command,
      context,
      dependencies: [],
      outputs: ['commandResult']
    });

    // Execute step
    const result = await this.workflow.executeStep(stepId);
    
    // Add to history
    this.commandHistory.push({
      command,
      context: contextString,
      result,
      timestamp: new Date()
    });

    return result;
  }

  /**
   * Build command context
   */
  private buildCommandContext(command: string, context: Record<string, any>): string {
    return `# Command Context

## Command
${command}

## Context
${JSON.stringify(context, null, 2)}

## Recent Commands
${this.commandHistory.slice(-5).map(h => 
  `- ${h.command} (${h.timestamp.toISOString()})`
).join('\n')}

## Workflow Variables
${JSON.stringify(this.workflow.getVariable('*') || {}, null, 2)}
`;
  }

  /**
   * Get command history
   */
  getHistory(): typeof this.commandHistory {
    return [...this.commandHistory];
  }
}

// Usage Examples
async function example() {
  // Create development workflow
  const workflow = new DevelopmentWorkflow('dev-session-1', '/path/to/project');
  
  // Execute full development cycle
  await workflow.executeDevelopmentCycle();
  
  // Check status
  const status = workflow.getStatus();
  console.log('Workflow Status:', status);
  
  // Generate summary
  const summary = workflow.generateSummary();
  console.log(summary);
  
  // Execute contextual commands
  const contextualCmd = new ContextualCommand(workflow);
  
  await contextualCmd.executeWithContext('git status', {
    purpose: 'check-git-status',
    expectedBranch: 'main'
  });
  
  await contextualCmd.executeWithContext('bun run dev', {
    purpose: 'start-dev-server',
    port: 3000
  });
}

export { 
  TerminalWorkflowEngine, 
  DevelopmentWorkflow, 
  ContextualCommand,
  WorkflowStep,
  WorkflowContext
};