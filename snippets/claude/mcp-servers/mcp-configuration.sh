#!/bin/bash
# Model Context Protocol (MCP) Server Configuration Examples

# Add MCP Stdio Server
claude mcp add database-server -e DB_URL="postgresql://localhost/mydb" -- node server.js
claude mcp add github-server -e GITHUB_TOKEN="ghp_xxx" -- /path/to/github-mcp-server

# Add MCP SSE Server (Server-Sent Events)
claude mcp add --transport sse weather-server https://api.weather.com/mcp-sse

# Add MCP HTTP Server
claude mcp add --transport http docs-server https://docs.mycompany.com/mcp

# Environment Variable Examples
claude mcp add api-server \
  -e API_KEY="secret-key" \
  -e BASE_URL="https://api.example.com" \
  -e TIMEOUT="30000" \
  -- node mcp-api-server.js

# OAuth 2.0 Authentication
claude mcp add oauth-server \
  -e CLIENT_ID="your-client-id" \
  -e CLIENT_SECRET="your-client-secret" \
  -e REDIRECT_URI="http://localhost:3000/callback" \
  -- python oauth-mcp-server.py

# List configured MCP servers
claude mcp list

# Remove MCP server
claude mcp remove server-name

# MCP Server Scopes
# Local scope (project-specific)
claude mcp add --scope local project-server ./local-server.js

# User scope (cross-project)
claude mcp add --scope user shared-server /usr/local/bin/shared-mcp-server

# Project scope (team-shared via .mcp.json)
# Add to .mcp.json in project root:
# {
#   "servers": {
#     "team-server": {
#       "command": "node",
#       "args": ["team-mcp-server.js"],
#       "env": {
#         "API_KEY": "${TEAM_API_KEY}"
#       }
#     }
#   }
# }

# Common MCP Server Types
claude mcp add database-explorer \
  -e DATABASE_URL="postgresql://user:pass@localhost/db" \
  -- npx @mcp/database-server

claude mcp add file-system \
  -e ROOT_PATH="/home/user/projects" \
  -- npx @mcp/filesystem-server

claude mcp add github-integration \
  -e GITHUB_TOKEN="ghp_xxx" \
  -e REPO_OWNER="myorg" \
  -- npx @mcp/github-server

claude mcp add slack-connector \
  -e SLACK_TOKEN="xoxb-xxx" \
  -e CHANNEL_ID="C1234567890" \
  -- npx @mcp/slack-server

# Using MCP Resources in Conversations
# Reference MCP resources with @ mentions:
# > "Show me the @database-schema for the users table"
# > "Create a PR using @github-integration for this feature"
# > "Check @slack-connector for recent messages about this issue"

# MCP Slash Commands
# Many MCP servers provide slash commands:
# /db-query SELECT * FROM users LIMIT 10
# /github-issue Create issue for bug fix
# /slack-post "Deploy completed successfully"

# Security Best Practices
# - Use environment variables for sensitive data
# - Validate MCP server sources before installation
# - Regular review of configured servers
# - Use least-privilege principle for server permissions
# - Monitor MCP server logs for suspicious activity

# Debugging MCP Servers
claude mcp logs server-name     # View server logs
claude mcp status server-name   # Check server status
claude mcp restart server-name  # Restart server
claude mcp test server-name     # Test server connection