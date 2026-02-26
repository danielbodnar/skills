#!/bin/bash
# Claude Code CLI Usage Examples

# Installation (requires Node.js 18+)
npm install -g @anthropic-ai/claude-code

# Basic Usage Patterns
claude                           # Start interactive mode
claude "add a hello world function"  # One-time task
claude -p "what does this code do?"  # One-off query

# Interactive Mode Commands
# > "what does this project do?"
# > "what technologies does this project use?"
# > "where is the main entry point?"
# > "add logging to this function"
# > "fix the bug in user authentication"
# > "commit my changes with a descriptive message"

# Built-in Commands
# /help           - Show available commands
# /reset          - Reset conversation context
# /exit           - Exit Claude Code
# Ctrl+C          - Exit Claude Code
# Tab             - Command completion
# ↑               - Command history

# Environment Setup
export ANTHROPIC_API_KEY="your-api-key"
export CLAUDE_CODE_USE_BEDROCK=1    # For AWS Bedrock
export CLAUDE_CODE_USE_VERTEX=1     # For Google Vertex AI

# Working with Projects
cd /path/to/your/project
claude "analyze the codebase structure"
claude "run the tests and fix any failures"
claude "optimize the database queries"
claude "add error handling to the API endpoints"

# Git Integration
claude "show me what files have changed"
claude "create a commit with the recent changes"
claude "help me resolve this merge conflict"
claude "write a detailed commit message for these changes"

# Code Generation Examples
claude "create a new React component for user profile"
claude "add TypeScript types for this API response"
claude "write unit tests for the authentication service"
claude "implement error handling for the HTTP client"

# Code Analysis
claude "review this code for security vulnerabilities"
claude "suggest performance improvements"
claude "explain how this algorithm works"
claude "find potential bugs in this function"