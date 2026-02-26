# Block Goose Reference

**Always remember to reference @$HOME/.claude/references/block-goose.md and look for snippets and examples in @$HOME/.claude/snippets/block-goose/**

## Quick Reference

- Installation: `pipx install goose-ai`
- CLI Command: `goose`
- Configuration: `goose configure`
- Documentation: <https://block.github.io/goose/docs/category/guides>
- GitHub: <https://github.com/block/goose>
- Package: <https://pypi.org/project/goose-ai/>

## Resources and Documentation

- [Block Goose Documentation](https://block.github.io/goose/docs/category/guides)
  - [Getting Started](https://block.github.io/goose/docs/getting-started/installation)
  - [Using Extensions](https://block.github.io/goose/docs/getting-started/using-extensions)
  - [Configuration](https://block.github.io/goose/docs/getting-started/providers)
  - [Tutorials](https://block.github.io/goose/docs/category/tutorials)
    - [Custom Extensions](https://block.github.io/goose/docs/tutorials/custom-extensions)
    - [Lead Worker](https://block.github.io/goose/docs/tutorials/lead-worker)
  - [Guides](https://block.github.io/goose/docs/category/guides)
    - [CLI Commands](https://block.github.io/goose/docs/guides/goose-cli-commands)
    - [Enhanced Code Editing](https://block.github.io/goose/docs/guides/enhanced-code-editing)
    - [Allowlist Configuration](https://block.github.io/goose/docs/guides/allowlist)
    - [Recipes](https://block.github.io/goose/docs/guides/recipes/recipe-reference)
  - [MCP Extensions](https://block.github.io/goose/docs/category/mcp-extensions)
    - [AgentQL](https://block.github.io/goose/docs/mcp/agentql-mcp)
    - [Brave Search](https://block.github.io/goose/docs/mcp/brave-mcp)
    - [Cloudinary](https://block.github.io/goose/docs/mcp/cloudinary-asset-management-mcp)
    - [Developer](https://block.github.io/goose/docs/mcp/developer-mcp)
    - [Figma](https://block.github.io/goose/docs/mcp/figma-mcp)
    - [PostgreSQL](https://block.github.io/goose/docs/mcp/postgres-mcp)
    - [Speech](https://block.github.io/goose/docs/mcp/speech-mcp)
- [GitHub Repository](https://github.com/block/goose)
  - [README](https://github.com/block/goose/blob/main/README.md)
  - [Installation Scripts](https://github.com/block/goose/releases/download/stable/download_cli.sh)
  - [FFI Documentation](https://github.com/block/goose/blob/main/crates/goose-ffi/README.md)
  - [LLM Bindings](https://github.com/block/goose/blob/main/crates/goose-llm/README.md)
- [Community Resources](https://discord.gg/block-opensource)
  - [Discord](https://discord.gg/block-opensource)
  - [YouTube](https://www.youtube.com/@blockopensource)
  - [LinkedIn](https://www.linkedin.com/company/block-opensource)

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/block-goose/`:

- Installation and setup patterns
- CLI configuration examples
- Extension setup and usage
- AI prompting patterns
- MCP server integration
- Development workflows

## Schema and Type Definitions

Configuration schemas and type definitions in `$HOME/.claude/snippets/block-goose/schemas/`

## AI Agent Capabilities

- **Autonomous Development**: Builds projects from scratch, writes and executes code
- **Debugging**: Identifies and fixes failures automatically
- **Workflow Orchestration**: Coordinates complex multi-step tasks
- **API Integration**: Connects with external services and APIs
- **Multi-Model Support**: Works with various LLMs (OpenAI, Anthropic, Google, etc.)
- **Extension System**: Expandable through MCP servers and custom extensions

## Key Features

- **Session Management**: Continuous interaction across multiple codebases
- **Project Handling**: Automatic context preservation
- **Permission Control**: Granular file modification permissions
- **Configuration**: YAML-based with environment variable support
- **Desktop & CLI**: Available as both desktop app and command-line tool
