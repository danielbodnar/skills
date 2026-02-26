#!/bin/bash

# Block Goose Extensions Configuration Examples

# === Extension Installation via Desktop UI ===

# AgentQL Extension
goose://extension?cmd=npx&arg=-y&arg=agentql-mcp&id=agentql&name=AgentQL&description=Transform%20unstructured%20web%20content%20into%20structured%20data&env=AGENTQL_API_KEY%3DAgentQL%20API%20Key

# Brave Search Extension
goose://extension?cmd=npx&arg=-y&arg=%40modelcontextprotocol%2Fserver-brave-search&id=brave-search&name=Brave%20Search&description=Brave%20Search%20API&env=BRAVE_API_KEY%3DYour%20API%20Key

# Cloudinary Asset Management
goose://extension?cmd=npx&arg=-y&arg=--package&arg=@cloudinary/asset-management&arg=--&arg=mcp&arg=start&id=cloudinary&name=Cloudinary%20Asset%20Management&description=Powerful%20media%20processing%20and%20transformation&env=CLOUDINARY_URL%3DCloudinary%20URL

# Figma Extension
goose://extension?cmd=npx&arg=-y&arg=@hapins/figma-mcp&id=figma&name=Figma&description=Figma%20integration

# PostgreSQL Extension
goose://extension?cmd=npx&arg=-y&arg=@modelcontextprotocol/server-postgres&arg=Your%20PostgreSQL%20connection%20URL&id=postgres&name=PostgreSQL&description=PostgreSQL%20database%20integration

# === Command-line Extension Installation ===

# Install extensions via npx
npx -y agentql-mcp
npx -y @modelcontextprotocol/server-brave-search
npx -y @hapins/figma-mcp
npx -y @modelcontextprotocol/server-postgres
npx -y @nostrbook/mcp@latest

# Install extensions via uvx (Python)
uvx mcp-wiki
uvx -p 3.10.14 speech-mcp@latest
uvx mcp_slack
uvx mcp_github
uvx mcp_jira

# === Extension Configuration Process ===

# Start configuration wizard
goose configure

# Example interactive flow:
# 1. Select "Add Extension"
# 2. Choose "Command-line Extension"
# 3. Enter extension name
# 4. Enter command to run
# 5. Set timeout (default: 300)
# 6. Add environment variables if needed

# === Built-in Extensions ===

# Knowledge Graph Memory
npx -y @modelcontextprotocol/server-memory

# Wikipedia Reader
uvx mcp-wiki

# Spring Data Explorer (Java)
jbang -Dspring.profiles.active=dev org.example:spring-data-mcp:1.0.0

# === Extension Environment Variables ===

# AgentQL
export AGENTQL_API_KEY="your-api-key"

# Brave Search
export BRAVE_API_KEY="your-api-key"

# Cloudinary
export CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

# PostgreSQL
export POSTGRES_URL="postgresql://username:password@hostname:5432/database"

# Spring Data
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/mydb"

# MQTT (for mbot2)
export MQTT_SERVER_URI="tcp://1.2.3.4:1883"
export MQTT_USERNAME="your_username"
export MQTT_PASSWORD="your_password"