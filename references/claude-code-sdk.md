# Claude Code TypeScript SDK Reference

**Always remember to reference ./references/claude-code-sdk.md and look for snippets and examples in ./snippets/claude-code-sdk/**

## Quick Reference

- Installation: `bun add @anthropic-ai/claude-code`
- Import: `import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-code'`
- Documentation: <https://docs.claude.com/en/docs/claude-code/sdk/sdk-typescript>
- GitHub: <https://github.com/anthropics/claude-code>
- Package: <https://www.npmjs.com/package/@anthropic-ai/claude-code>

## Resources and Documentation

- [Claude Code SDK Documentation](https://docs.claude.com/en/docs/claude-code/sdk)
  - [TypeScript SDK](https://docs.claude.com/en/docs/claude-code/sdk/sdk-typescript)
    - [Core API Reference](https://docs.claude.com/en/docs/claude-code/sdk/sdk-typescript#api-reference)
    - [Query Function](https://docs.claude.com/en/docs/claude-code/sdk/sdk-typescript#query)
    - [Tool Creation](https://docs.claude.com/en/docs/claude-code/sdk/sdk-typescript#tool)
    - [MCP Server Creation](https://docs.claude.com/en/docs/claude-code/sdk/sdk-typescript#createsdkmcpserver)
    - [Permission Management](https://docs.claude.com/en/docs/claude-code/sdk/sdk-typescript#permission-management)
  - [Headless Mode](https://docs.claude.com/en/docs/claude-code/sdk/sdk-headless)
    - [CLI Options](https://docs.claude.com/en/docs/claude-code/sdk/sdk-headless#cli-options)
    - [Output Formats](https://docs.claude.com/en/docs/claude-code/sdk/sdk-headless#output-formats)
    - [Automation Patterns](https://docs.claude.com/en/docs/claude-code/sdk/sdk-headless#automation-patterns)
  - [Modifying System Prompts](https://docs.claude.com/en/docs/claude-code/sdk/modifying-system-prompts)
    - [Output Styles](https://docs.claude.com/en/docs/claude-code/sdk/modifying-system-prompts#output-styles)
    - [appendSystemPrompt](https://docs.claude.com/en/docs/claude-code/sdk/modifying-system-prompts#appendsystemprompt)
    - [customSystemPrompt](https://docs.claude.com/en/docs/claude-code/sdk/modifying-system-prompts#customsystemprompt)
  - [Subagents](https://docs.claude.com/en/docs/claude-code/sdk/subagents)
    - [Creating Subagents](https://docs.claude.com/en/docs/claude-code/sdk/subagents#creating-subagents)
    - [Tool Restrictions](https://docs.claude.com/en/docs/claude-code/sdk/subagents#tool-restrictions)
    - [Parallelization](https://docs.claude.com/en/docs/claude-code/sdk/subagents#parallelization)
  - [Slash Commands](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands)
    - [Built-in Commands](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands#built-in-commands)
    - [Custom Commands](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands#custom-commands)
    - [Command Arguments](https://docs.claude.com/en/docs/claude-code/sdk/sdk-slash-commands#command-arguments)
- [Common Workflows](https://docs.claude.com/en/docs/claude-code/common-workflows)
  - [Understanding Codebases](https://docs.claude.com/en/docs/claude-code/common-workflows#understanding-codebases)
  - [Bug Fixing](https://docs.claude.com/en/docs/claude-code/common-workflows#bug-fixing)
  - [Refactoring](https://docs.claude.com/en/docs/claude-code/common-workflows#refactoring)
  - [Testing](https://docs.claude.com/en/docs/claude-code/common-workflows#testing)
  - [Plan Mode](https://docs.claude.com/en/docs/claude-code/common-workflows#plan-mode)
- [Community Resources](https://github.com/anthropics/claude-code/discussions)
  - [Examples Repository](https://github.com/anthropics/claude-code/tree/main/examples)
  - [Issue Tracker](https://github.com/anthropics/claude-code/issues)
  - [Discord Community](https://discord.gg/anthropic)

## Core API Functions

### query()

Primary method for interacting with Claude Code

```typescript
function query({
  prompt,
  options
}: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): Query
```

### tool()

Creates type-safe MCP tool definitions

```typescript
function tool<Schema extends ZodRawShape>(
  name: string,
  description: string,
  inputSchema: Schema,
  handler: (args: z.infer<ZodObject<Schema>>, extra: ToolHandlerExtra) => Promise<CallToolResult>
): SdkMcpToolDefinition<Schema>
```

### createSdkMcpServer()

Creates an MCP server instance

```typescript
function createSdkMcpServer(options: {
  name: string;
  version?: string;
  tools?: Array<SdkMcpToolDefinition<any>>;
  resources?: Array<Resource>;
  prompts?: Array<Prompt>;
}): McpSdkServerConfigWithInstance
```

### updateOptions()

Updates query options mid-conversation

```typescript
function updateOptions(queryGenerator: AsyncIterable<SDKMessage>, newOptions: Options): void
```

### sdkMessageFromEvent()

Converts UI events to SDK messages

```typescript
function sdkMessageFromEvent(event: UIEvent): SDKMessage | undefined
```

## Configuration Options

### Query Options

- `customSystemPrompt`: Replace entire system prompt
- `appendSystemPrompt`: Add to existing system prompt
- `allowedTools`: Specify permitted tools
- `defaultSlashCommand`: Default command to run
- `slashCommandAutoSend`: Auto-execute slash commands
- `debugMode`: Enable debugging output
- `historyMessages`: Include conversation history
- `preserveToolResults`: Keep tool output in context
- `hooks`: Attach event handlers
- `toolSet`: Available tools for the query
- `mcpServers`: MCP server configurations
- `permissionMode`: Permission handling mode

### Permission Modes

- `default`: Standard permission flow
- `bypass`: Skip permission checks
- `plan`: Enter planning mode

### Built-in Tools

- File Operations: `Read`, `Write`, `Edit`, `MultiEdit`
- Web: `WebSearch`, `WebFetch`
- System: `Bash`, `BashOutput`, `KillShell`
- Task Management: `TodoWrite`, `Task`
- Version Control: Git operations
- Special: `NotebookEdit`, `ExitPlanMode`

## Code Examples Location

Comprehensive examples available in `./snippets/claude-code-sdk/`:

- Basic query patterns
- Tool creation and usage
- Subagent implementation
- System prompt customization
- Headless automation
- MCP server integration
- Permission management
- Hook implementation
- Error handling patterns
- Testing strategies

## Schema and Type Definitions

Type definitions and validation schemas in `./snippets/claude-code-sdk/schemas/`

## Integration Patterns

### With MCP Servers

```typescript
import { createSdkMcpServer, query } from '@anthropic-ai/claude-code'

const server = createSdkMcpServer({
  name: "my-server",
  tools: [/* custom tools */]
})

const response = query({
  prompt: "Use my custom server",
  options: {
    mcpServers: [server]
  }
})
```

### With Custom Tools

```typescript
import { tool } from '@anthropic-ai/claude-code'
import { z } from 'zod'

const customTool = tool(
  "analyze-code",
  "Analyze code quality",
  { code: z.string() },
  async (args) => ({ content: "Analysis result" })
)
```

### Headless Automation

```bash
claude -p "Refactor for performance" \
  --allowedTools "Read,Edit,Bash" \
  --output-format json \
  --permission-mode acceptEdits
```

## See Also

- Complete reference: `./references/claude-code-sdk.md`
- Code examples: `./snippets/claude-code-sdk/`
- Schemas: `./snippets/claude-code-sdk/schemas/`
- Commands: `./commands/claude-code-*.md`
