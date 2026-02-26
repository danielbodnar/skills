# Claude Code CLI - Basic Usage Examples

# Installation
npm install -g @anthropic-ai/claude-code

# Authentication setup
export ANTHROPIC_API_KEY="your-api-key-here"

# Start interactive Claude Code session
claude

# Run Claude Code with specific prompt
claude "Help me refactor this function to use async/await"

# Run in non-interactive mode with JSON output
claude --json "Analyze the performance of this database query"

# Resume previous conversation
claude --resume

# Use with custom system prompt
claude --system "You are a senior TypeScript developer" "Review this code for best practices"

# Run with specific model
claude --model claude-3-opus-20240229 "Complex reasoning task"

# Run with maximum turns limit
claude --max-turns 5 "Help me debug this issue step by step"

# Show usage help
claude --help

# Common interactive commands
# /help - Show available commands
# /clear - Clear conversation history
# /model - Switch models
# /exit - Exit Claude Code