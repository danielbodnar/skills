# Claude AI Reference

**Always remember to reference @$HOME/.claude/references/claude.md and look for snippets and examples in @$HOME/.claude/snippets/claude/**

## Quick Reference

- **Installation**: `npm install -g @anthropic-ai/claude-code` (requires Node.js 18+)
- **CLI Usage**: `claude` (interactive mode) or `claude "task"` (one-time task)
- **Query Mode**: `claude -p "query"` for one-off queries
- **Documentation**: <https://docs.anthropic.com/en/docs/claude-code>
- **Console**: <https://console.anthropic.com/>
- **Web Interface**: <https://claude.ai>
- **GitHub**: <https://github.com/anthropics/claude-code>

## Resources and Documentation

- [Claude AI Documentation](https://docs.anthropic.com/en/docs)
  - [Getting Started](https://docs.anthropic.com/en/docs/getting-started)
  - [API Reference](https://docs.anthropic.com/en/docs/api)
    - [Authentication](https://docs.anthropic.com/en/docs/api/authentication)
    - [Messages API](https://docs.anthropic.com/en/docs/api/messages)
    - [Streaming](https://docs.anthropic.com/en/docs/api/streaming)
    - [Vision](https://docs.anthropic.com/en/docs/api/vision)
    - [Tool Use](https://docs.anthropic.com/en/docs/api/tool-use)
  - [Prompt Engineering](https://docs.anthropic.com/en/docs/prompt-engineering)
    - [Best Practices](https://docs.anthropic.com/en/docs/prompt-engineering/best-practices)
    - [XML Tags](https://docs.anthropic.com/en/docs/prompt-engineering/xml-tags)
    - [Chain of Thought](https://docs.anthropic.com/en/docs/prompt-engineering/chain-of-thought)
  - [Safety & Evaluation](https://docs.anthropic.com/en/docs/safety-evaluation)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
  - [Overview](https://docs.anthropic.com/en/docs/claude-code/overview)
  - [Quickstart](https://docs.anthropic.com/en/docs/claude-code/quickstart)
  - [Memory Management](https://docs.anthropic.com/en/docs/claude-code/memory)
  - [Common Workflows](https://docs.anthropic.com/en/docs/claude-code/common-workflows)
  - [IDE Integrations](https://docs.anthropic.com/en/docs/claude-code/ide-integrations)
  - [Model Context Protocol](https://docs.anthropic.com/en/docs/claude-code/mcp)
  - [GitHub Actions](https://docs.anthropic.com/en/docs/claude-code/github-actions)
  - [SDK](https://docs.anthropic.com/en/docs/claude-code/sdk)
  - [Troubleshooting](https://docs.anthropic.com/en/docs/claude-code/troubleshooting)
  - [Third-party Integrations](https://docs.anthropic.com/en/docs/claude-code/third-party-integrations)
    - [Amazon Bedrock](https://docs.anthropic.com/en/docs/claude-code/amazon-bedrock)
    - [Google Vertex AI](https://docs.anthropic.com/en/docs/claude-code/google-vertex-ai)
  - [Enterprise Features](https://docs.anthropic.com/en/docs/claude-code/enterprise)
    - [Corporate Proxy](https://docs.anthropic.com/en/docs/claude-code/corporate-proxy)
    - [LLM Gateway](https://docs.anthropic.com/en/docs/claude-code/llm-gateway)
    - [DevContainer](https://docs.anthropic.com/en/docs/claude-code/devcontainer)
    - [IAM](https://docs.anthropic.com/en/docs/claude-code/iam)
    - [Security](https://docs.anthropic.com/en/docs/claude-code/security)
    - [Monitoring Usage](https://docs.anthropic.com/en/docs/claude-code/monitoring-usage)
    - [Costs](https://docs.anthropic.com/en/docs/claude-code/costs)
  - [CLI Reference](https://docs.anthropic.com/en/docs/claude-code/cli-reference)
  - [Interactive Mode](https://docs.anthropic.com/en/docs/claude-code/interactive-mode)
  - [Slash Commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands)
  - [Settings](https://docs.anthropic.com/en/docs/claude-code/settings)
- [Community Resources](https://docs.anthropic.com/en/docs/resources)
  - [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
  - [Prompt Library](https://docs.anthropic.com/en/prompt-library)
  - [Model Card](https://www.anthropic.com/claude)

## Current Models Available

- **Claude Sonnet 4**: Latest high-performance model with exceptional reasoning and coding capabilities
- **Claude Opus 3.5**: Advanced model with superior reasoning for complex tasks
- **Claude Sonnet 3.5**: Balanced performance and efficiency
- **Claude Haiku 3.5**: Fast and lightweight model for simple tasks

## Authentication Options

1. **Anthropic API Key** (Recommended)
   - Environment: `ANTHROPIC_API_KEY`
   - Console: <https://console.anthropic.com/>

2. **Amazon Bedrock**
   - Environment: `CLAUDE_CODE_USE_BEDROCK=1`
   - Requires AWS credentials

3. **Google Vertex AI**
   - Environment: `CLAUDE_CODE_USE_VERTEX=1`
   - Requires GCP credentials

## Model Context Protocol (MCP)

### Overview

MCP is an open protocol that enables Claude Code to access external tools and data sources through specialized servers.

### MCP Server Configuration

```bash
# Add MCP Stdio Server
claude mcp add <name> <command> [args...]
claude mcp add my-server -e API_KEY=123 -- /path/to/server arg1 arg2

# Add MCP SSE Server
claude mcp add --transport sse sse-server https://example.com/sse-endpoint

# Add MCP HTTP Server  
claude mcp add --transport http http-server https://example.com/mcp
```

### MCP Server Scopes

- **Local scope**: Personal, project-specific servers
- **Project scope**: Team-shared servers in `.mcp.json`
- **User scope**: Cross-project servers accessible across multiple projects

### MCP Features

- OAuth 2.0 authentication support
- Environment variable expansion in configuration
- Resource referencing with `@` mentions
- Slash commands from MCP servers
- Database schema exploration
- GitHub issue analysis
- API documentation review

### Security Note

⚠️ Use third-party MCP servers at your own risk due to potential prompt injection risks.

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/claude/`:

- **CLI Usage**: `cli-usage/` - Basic commands and interactive patterns
- **MCP Servers**: `mcp-servers/` - Model Context Protocol configuration
- **Quickstart**: `quickstart-examples/` - First session examples and workflows
- **Git Integration**: `git-integration/` - Version control operations
- **Enterprise Config**: `enterprise-config/` - Enterprise deployment patterns
- **API Authentication**: Authentication methods and token management
- **Prompt Engineering**: Structured prompting techniques
- **Error Handling**: Error management and recovery patterns
- **Vision Processing**: Image analysis and diagram interpretation
- **Tool Use**: External API integration examples

## Core Capabilities

### Development Workflow

- **Code Generation**: TypeScript, JavaScript, Python, Rust, Go, and more
- **Code Analysis**: Architecture review, debugging, optimization
- **File Operations**: Reading, writing, editing across codebases
- **Git Integration**: History search, merge conflict resolution, commit creation
- **Testing**: Test execution, debugging, and fixes
- **Documentation**: Code explanation, API documentation generation

### Advanced Features

- **Vision Processing**: Image analysis, diagram interpretation
- **Tool Use**: External API integration, custom tool creation
- **Streaming**: Real-time response handling
- **Multi-turn Conversations**: Context-aware interactions
- **Sub-agent Support**: Delegate tasks to specialized agents
- **Memory Management**: CLAUDE.md file for project context
- **Custom Hooks**: Configurable workflow automation

### Integration Capabilities

- **Model Context Protocol (MCP)**: Connect to external data sources and tools
- **IDE Integrations**: VS Code, JetBrains, and other editor support
- **GitHub Actions**: CI/CD workflow integration
- **Terminal Enhancement**: Unix-style piping and scripting support

## Enterprise Features

### Administration & Security

- **IAM**: Identity and Access Management
- **Security Configuration**: Advanced security controls
- **Usage Monitoring**: Analytics and usage tracking
- **Cost Tracking**: Organizational cost management
- **Member Management**: Workspace and user administration

### Deployment Options

- **Amazon Bedrock**: Enterprise AWS integration
- **Google Vertex AI**: Enterprise GCP integration
- **Corporate Proxy**: Proxy configuration support
- **LLM Gateway**: Centralized LLM access management
- **DevContainer**: Containerized development environments

## Quickstart Guide

### Installation & Setup

```bash
# Install Claude Code (requires Node.js 18+)
npm install -g @anthropic-ai/claude-code

# Navigate to your project
cd /path/to/your/project

# Start interactive session
claude
```

### First Steps

```bash
# Understand your project
> "what does this project do?"
> "what technologies does this project use?"
> "where is the main entry point?"

# Make code changes
> "add a hello world function to the main file"

# Git operations
> "what files have I changed?"
> "commit my changes with a descriptive message"
```

### Key Commands

- `claude`: Start interactive mode
- `claude "task"`: Run a one-time task
- `claude -p "query"`: Run a one-off query
- `/help`: Show available commands
- `exit` or Ctrl+C: Exit Claude Code
- Tab: Command completion
- ↑: Command history

## Best Practices

- **Be Specific**: Use clear, direct prompts with specific requirements
- **Break Down Tasks**: Divide complex tasks into manageable steps
- **Let Claude Explore**: Allow Claude to understand your project first
- **Use XML Tags**: Implement XML tags for structured input/output
- **Memory Management**: Utilize CLAUDE.md for project context
- **Error Handling**: Handle errors gracefully with proper exception handling
- **Security**: Follow security best practices for API key management
- **Model Selection**: Use appropriate models for task complexity

## Troubleshooting

### Common Issues

- **Node.js Version**: Ensure Node.js 18+ is installed
- **API Key**: Verify `ANTHROPIC_API_KEY` is set correctly
- **Network**: Check internet connection and proxy settings
- **Permissions**: Ensure file write permissions in project directory
- **Git**: Verify git is installed and configured

### Performance Optimization

- Use specific, focused prompts for better results
- Break complex tasks into smaller, manageable steps
- Leverage CLAUDE.md for project context and memory
- Use appropriate model based on task complexity
- Configure MCP servers for specialized tasks

### Getting Help

- Use `/help` command in interactive mode
- Check documentation at <https://docs.anthropic.com/en/docs/claude-code>
- Review troubleshooting guide for common solutions
- Consult community resources and examples

## Recent Updates (2025)

### New Features

- **Claude Sonnet 4**: Latest high-performance model available
- **Enhanced MCP**: Improved Model Context Protocol with OAuth 2.0 support
- **Sub-agent Support**: Delegate tasks to specialized agents
- **Custom Hooks**: Configurable workflow automation
- **Enterprise Features**: Advanced administration and security controls

### Improvements

- **Faster Startup**: Reduced initialization time
- **Better Memory**: Enhanced context management with CLAUDE.md
- **IDE Integration**: Improved editor support and extensions
- **Terminal Enhancement**: Better Unix-style piping and scripting
- **Security**: Enhanced security controls and audit capabilities

### See Also

- Complete reference: `@$HOME/.claude/references/claude.md`
- Code examples: `@$HOME/.claude/snippets/claude/`
- Enterprise features: Enterprise deployment and administration
- MCP servers: Model Context Protocol configuration
- Troubleshooting: Common issues and solutions
