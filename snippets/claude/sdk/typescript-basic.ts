// Claude Code SDK - TypeScript Basic Usage

import { query } from "@anthropic-ai/claude-code";

// Basic query example
async function basicQuery() {
  try {
    for await (const message of query({
      prompt: "Write a TypeScript function to validate email addresses",
      options: { maxTurns: 3 }
    })) {
      if (message.type === "text") {
        console.log("Claude:", message.content);
      } else if (message.type === "tool_use") {
        console.log("Tool used:", message.name, message.input);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Multi-turn conversation with context
async function multiTurnConversation() {
  const conversation = query({
    prompt: "Help me build a REST API",
    options: {
      maxTurns: 10,
      systemPrompt: "You are an expert backend developer specializing in Node.js and TypeScript"
    }
  });

  for await (const message of conversation) {
    if (message.type === "text") {
      console.log("Response:", message.content);
      
      // Continue conversation based on response
      if (message.content.includes("database")) {
        // Add follow-up question
        conversation.addMessage("What database would you recommend for this use case?");
      }
    }
  }
}

// JSON output for programmatic processing
async function jsonOutput() {
  const result = await query({
    prompt: "Analyze this code and return a JSON report of potential issues",
    options: {
      format: "json",
      maxTurns: 1
    }
  });

  // Process structured output
  const analysis = JSON.parse(result.content);
  console.log("Issues found:", analysis.issues.length);
}

// Error handling and retries
async function robustQuery() {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await query({
        prompt: "Generate a comprehensive test suite",
        options: {
          timeout: 30000, // 30 seconds
          maxTurns: 5
        }
      });
      
      return result;
    } catch (error) {
      attempt++;
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt >= maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}

// Export functions for use
export {
  basicQuery,
  multiTurnConversation,
  jsonOutput,
  robustQuery
};