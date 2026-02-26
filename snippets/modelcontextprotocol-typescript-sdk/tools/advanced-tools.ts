/**
 * Advanced MCP Tools Examples
 * 
 * Demonstrates sophisticated tool implementations including file operations,
 * API integrations, database queries, and complex data processing.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Database } from "bun:sqlite";
import { z } from "zod";
import { readdir, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";

const server = new McpServer({
  name: "advanced-tools-server",
  version: "1.0.0"
});

// === FILE SYSTEM TOOLS ===

// File explorer tool
server.registerTool(
  "explore-directory",
  {
    title: "Directory Explorer",
    description: "Explore directory contents with filtering and metadata",
    inputSchema: {
      path: z.string().min(1, "Path is required"),
      includeHidden: z.boolean().default(false),
      maxDepth: z.number().int().min(0).max(5).default(1),
      pattern: z.string().optional(),
      sortBy: z.enum(["name", "size", "modified"]).default("name")
    }
  },
  async ({ path, includeHidden, maxDepth, pattern, sortBy }) => {
    try {
      const items = await exploreDirectory(path, {
        includeHidden,
        maxDepth,
        pattern,
        sortBy
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(items, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text", 
          text: `Error exploring directory: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

async function exploreDirectory(
  dirPath: string, 
  options: {
    includeHidden: boolean;
    maxDepth: number;
    pattern?: string;
    sortBy: string;
  },
  currentDepth = 0
): Promise<any[]> {
  if (currentDepth > options.maxDepth) return [];

  const items = await readdir(dirPath);
  const results = [];

  for (const item of items) {
    if (!options.includeHidden && item.startsWith('.')) continue;
    if (options.pattern && !item.includes(options.pattern)) continue;

    const itemPath = join(dirPath, item);
    const stats = await stat(itemPath);
    
    const itemInfo = {
      name: item,
      path: itemPath,
      type: stats.isDirectory() ? 'directory' : 'file',
      size: stats.size,
      modified: stats.mtime.toISOString(),
      extension: stats.isFile() ? extname(item) : null
    };

    if (stats.isDirectory() && currentDepth < options.maxDepth) {
      itemInfo.children = await exploreDirectory(itemPath, options, currentDepth + 1);
    }

    results.push(itemInfo);
  }

  // Sort results
  results.sort((a, b) => {
    switch (options.sortBy) {
      case 'size':
        return b.size - a.size;
      case 'modified':
        return new Date(b.modified).getTime() - new Date(a.modified).getTime();
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return results;
}

// File content analyzer
server.registerTool(
  "analyze-file",
  {
    title: "File Analyzer",
    description: "Analyze file content and metadata",
    inputSchema: {
      path: z.string(),
      analysis: z.array(z.enum([
        "basic", "encoding", "lines", "words", "languages", "structure"
      ])).default(["basic"])
    }
  },
  async ({ path, analysis }) => {
    try {
      const file = Bun.file(path);
      const exists = await file.exists();
      
      if (!exists) {
        return {
          content: [{
            type: "text",
            text: `File not found: ${path}`
          }],
          isError: true
        };
      }

      const result: any = {
        path,
        name: basename(path),
        extension: extname(path),
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      };

      if (analysis.includes("basic")) {
        const text = await file.text();
        result.basic = {
          isEmpty: text.length === 0,
          isTextFile: isTextFile(path),
          canRead: true
        };
      }

      if (analysis.includes("encoding")) {
        const buffer = await file.arrayBuffer();
        result.encoding = detectEncoding(new Uint8Array(buffer));
      }

      if (analysis.includes("lines") || analysis.includes("words")) {
        const text = await file.text();
        
        if (analysis.includes("lines")) {
          const lines = text.split('\n');
          result.lines = {
            total: lines.length,
            empty: lines.filter(line => line.trim() === '').length,
            nonEmpty: lines.filter(line => line.trim() !== '').length
          };
        }

        if (analysis.includes("words")) {
          const words = text.split(/\s+/).filter(word => word.length > 0);
          result.words = {
            total: words.length,
            unique: new Set(words.map(w => w.toLowerCase())).size,
            average: words.length > 0 ? text.length / words.length : 0
          };
        }
      }

      if (analysis.includes("languages")) {
        result.languages = detectLanguages(path, await file.text());
      }

      if (analysis.includes("structure")) {
        result.structure = analyzeStructure(path, await file.text());
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error analyzing file: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// === DATABASE TOOLS ===

// Initialize SQLite database
const db = new Database("advanced_tools.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Database query tool with safety checks
server.registerTool(
  "database-query",
  {
    title: "Database Query",
    description: "Execute safe database queries",
    inputSchema: {
      query: z.string(),
      parameters: z.array(z.any()).default([]),
      operation: z.enum(["select", "insert", "update", "delete"]),
      maxRows: z.number().int().min(1).max(1000).default(100)
    }
  },
  async ({ query, parameters, operation, maxRows }) => {
    try {
      // Security: Basic SQL injection prevention
      const normalizedQuery = query.toLowerCase().trim();
      
      // Only allow specified operations
      if (!normalizedQuery.startsWith(operation)) {
        return {
          content: [{
            type: "text",
            text: `Query must start with ${operation.toUpperCase()}`
          }],
          isError: true
        };
      }

      // Prevent dangerous operations
      const dangerousKeywords = ['drop', 'alter', 'create', 'truncate'];
      for (const keyword of dangerousKeywords) {
        if (normalizedQuery.includes(keyword)) {
          return {
            content: [{
              type: "text",
              text: `Dangerous keyword '${keyword}' not allowed`
            }],
            isError: true
          };
        }
      }

      let result;
      if (operation === "select") {
        const stmt = db.prepare(query);
        result = stmt.all(...parameters).slice(0, maxRows);
      } else {
        const stmt = db.prepare(query);
        result = stmt.run(...parameters);
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            operation,
            query,
            parameters,
            result,
            rowCount: Array.isArray(result) ? result.length : 1
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Database error: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Note management tool
server.registerTool(
  "manage-notes",
  {
    title: "Note Manager",
    description: "Create, update, and search notes",
    inputSchema: {
      action: z.enum(["create", "list", "search", "update", "delete"]),
      id: z.number().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      tags: z.string().optional(),
      searchTerm: z.string().optional()
    }
  },
  async ({ action, id, title, content, tags, searchTerm }) => {
    try {
      let result;

      switch (action) {
        case "create":
          if (!title) {
            return {
              content: [{ type: "text", text: "Title is required for creating notes" }],
              isError: true
            };
          }
          const createStmt = db.prepare(
            "INSERT INTO notes (title, content, tags) VALUES (?, ?, ?)"
          );
          result = createStmt.run(title, content || "", tags || "");
          break;

        case "list":
          const listStmt = db.prepare("SELECT * FROM notes ORDER BY updated_at DESC LIMIT 20");
          result = listStmt.all();
          break;

        case "search":
          if (!searchTerm) {
            return {
              content: [{ type: "text", text: "Search term is required" }],
              isError: true
            };
          }
          const searchStmt = db.prepare(`
            SELECT * FROM notes 
            WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
            ORDER BY updated_at DESC
          `);
          const term = `%${searchTerm}%`;
          result = searchStmt.all(term, term, term);
          break;

        case "update":
          if (!id) {
            return {
              content: [{ type: "text", text: "Note ID is required for updates" }],
              isError: true
            };
          }
          const updateStmt = db.prepare(`
            UPDATE notes 
            SET title = COALESCE(?, title), 
                content = COALESCE(?, content), 
                tags = COALESCE(?, tags),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `);
          result = updateStmt.run(title, content, tags, id);
          break;

        case "delete":
          if (!id) {
            return {
              content: [{ type: "text", text: "Note ID is required for deletion" }],
              isError: true
            };
          }
          const deleteStmt = db.prepare("DELETE FROM notes WHERE id = ?");
          result = deleteStmt.run(id);
          break;
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ action, result }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Note management error: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// === WEB API INTEGRATION TOOLS ===

// HTTP client tool with timeout and retries
server.registerTool(
  "http-request",
  {
    title: "HTTP Request",
    description: "Make HTTP requests with advanced options",
    inputSchema: {
      url: z.string().url(),
      method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
      headers: z.record(z.string()).optional(),
      body: z.string().optional(),
      timeout: z.number().int().min(1000).max(30000).default(10000),
      retries: z.number().int().min(0).max(3).default(0)
    }
  },
  async ({ url, method, headers, body, timeout, retries }) => {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          method,
          headers: {
            'User-Agent': 'MCP-Advanced-Tools/1.0.0',
            ...headers
          },
          body: method !== 'GET' ? body : undefined,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const responseBody = await response.text();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              body: responseBody,
              attempt: attempt + 1
            }, null, 2)
          }]
        };
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    
    return {
      content: [{
        type: "text",
        text: `HTTP request failed after ${retries + 1} attempts: ${lastError.message}`
      }],
      isError: true
    };
  }
);

// === UTILITY FUNCTIONS ===

function isTextFile(path: string): boolean {
  const textExtensions = [
    '.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.ts',
    '.py', '.java', '.c', '.cpp', '.h', '.rs', '.go', '.sh', '.yml', '.yaml'
  ];
  return textExtensions.includes(extname(path).toLowerCase());
}

function detectEncoding(buffer: Uint8Array): string {
  // Simple encoding detection
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'UTF-8 BOM';
  }
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'UTF-16 LE';
  }
  if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'UTF-16 BE';
  }
  
  // Check for non-ASCII characters
  for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
    if (buffer[i] > 127) {
      return 'Binary or Non-ASCII';
    }
  }
  
  return 'ASCII/UTF-8';
}

function detectLanguages(path: string, content: string): string[] {
  const languages = [];
  const ext = extname(path).toLowerCase();
  
  // File extension based detection
  const extensionMap: Record<string, string> = {
    '.js': 'JavaScript',
    '.ts': 'TypeScript', 
    '.py': 'Python',
    '.rs': 'Rust',
    '.go': 'Go',
    '.java': 'Java',
    '.c': 'C',
    '.cpp': 'C++',
    '.h': 'C Header',
    '.css': 'CSS',
    '.html': 'HTML',
    '.xml': 'XML',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.sh': 'Shell',
    '.sql': 'SQL'
  };
  
  if (extensionMap[ext]) {
    languages.push(extensionMap[ext]);
  }
  
  // Content-based detection (simple heuristics)
  if (content.includes('import ') && content.includes('from ')) {
    languages.push('Python/JavaScript');
  }
  if (content.includes('<?xml') || content.includes('<!DOCTYPE html>')) {
    languages.push('XML/HTML');
  }
  if (content.includes('fn main()') || content.includes('use std::')) {
    languages.push('Rust');
  }
  
  return [...new Set(languages)];
}

function analyzeStructure(path: string, content: string): any {
  const ext = extname(path).toLowerCase();
  const lines = content.split('\n');
  
  const structure: any = {
    totalLines: lines.length,
    emptyLines: lines.filter(line => line.trim() === '').length
  };
  
  if (['.js', '.ts', '.py', '.rs'].includes(ext)) {
    // Code structure analysis
    structure.functions = (content.match(/function\s+\w+|def\s+\w+|fn\s+\w+/g) || []).length;
    structure.classes = (content.match(/class\s+\w+|struct\s+\w+/g) || []).length;
    structure.imports = (content.match(/import\s+|from\s+.*import|use\s+/g) || []).length;
    structure.comments = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('#') || 
             trimmed.startsWith('/*') || trimmed.startsWith('*');
    }).length;
  }
  
  if (ext === '.json') {
    try {
      const parsed = JSON.parse(content);
      structure.jsonStructure = {
        keys: Object.keys(parsed).length,
        depth: getObjectDepth(parsed)
      };
    } catch {
      structure.jsonStructure = { error: 'Invalid JSON' };
    }
  }
  
  return structure;
}

function getObjectDepth(obj: any): number {
  if (typeof obj !== 'object' || obj === null) return 0;
  
  let depth = 1;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      depth = Math.max(depth, 1 + getObjectDepth(obj[key]));
    }
  }
  return depth;
}

// === START SERVER ===

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Advanced tools MCP server started");
console.error("Available tools: explore-directory, analyze-file, database-query, manage-notes, http-request");