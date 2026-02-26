// Claude Prompt Engineering Best Practices

import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 1. Clear and Direct Prompts
export const clearPrompts = {
  // Good: Specific and actionable
  good: `Write a TypeScript function that:
1. Accepts an array of user objects
2. Filters users by active status
3. Sorts by last login date (newest first)
4. Returns only username and email fields

Include proper TypeScript types and error handling.`,

  // Bad: Vague and ambiguous
  bad: "Make a function for users"
};

// 2. XML Tags for Structure
export async function structuredPrompt() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `
<task>
Analyze the following code for security vulnerabilities
</task>

<code>
function login(username, password) {
  const query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
  return database.query(query);
}
</code>

<format>
Return your analysis in this format:
- Vulnerability type
- Risk level (High/Medium/Low)
- Explanation
- Recommended fix
</format>
`
    }]
  });

  return response;
}

// 3. System Prompts for Consistency
export async function systemPromptExample() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    system: `You are a senior TypeScript developer with expertise in:
- Clean architecture patterns
- Test-driven development
- Performance optimization
- Security best practices

Always provide code examples with proper TypeScript types.
Explain your reasoning and include error handling.
Suggest testing strategies for your solutions.`,
    messages: [{
      role: 'user',
      content: 'How should I structure a Node.js microservice for handling user authentication?'
    }]
  });

  return response;
}

// 4. Chain of Thought Reasoning
export async function chainOfThoughtPrompt() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `I need to optimize this database query that's running slowly:

SELECT u.*, p.title, c.name as category 
FROM users u 
LEFT JOIN posts p ON u.id = p.user_id 
LEFT JOIN categories c ON p.category_id = c.id 
WHERE u.active = 1 AND p.created_at > '2024-01-01'

Think through this step by step:
1. First, identify potential performance bottlenecks
2. Then, suggest specific optimizations
3. Finally, provide the optimized query with explanation

Explain your reasoning for each step.`
    }]
  });

  return response;
}

// 5. Multishot Prompting (Few-shot Examples)
export async function multishotPrompt() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `I need help writing API error responses. Here are some examples of the format I want:

Example 1:
Input: User not found
Output: {
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "The requested user could not be found",
    "details": "No user exists with the provided identifier",
    "statusCode": 404
  }
}

Example 2:
Input: Invalid email format
Output: {
  "error": {
    "code": "INVALID_EMAIL",
    "message": "The provided email address is not valid",
    "details": "Email must be in format: user@domain.com",
    "statusCode": 400
  }
}

Now create an error response for: "Database connection failed"`
    }]
  });

  return response;
}

// 6. Prefill Response Templates
export async function prefillResponse() {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: 'Write a React component for a user profile card'
      },
      {
        role: 'assistant',
        content: 'I\'ll create a React component for a user profile card. Here\'s the implementation:\n\n```tsx\ninterface UserProfileProps {\n'
      }
    ]
  });

  return response;
}

// 7. Complex Reasoning with Context
export async function complexReasoningPrompt() {
  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229', // Use Opus for complex reasoning
    max_tokens: 2000,
    system: `You are an expert software architect. When analyzing systems:
1. Consider scalability, maintainability, and performance
2. Identify potential failure points
3. Suggest monitoring and observability strategies
4. Include security considerations
5. Provide concrete implementation details`,
    messages: [{
      role: 'user',
      content: `I'm designing a real-time chat application that needs to handle:
- 100,000 concurrent users
- Message persistence
- File sharing
- Push notifications
- Cross-platform support (web, mobile)

Please design a comprehensive architecture. Consider:
- Backend services and their responsibilities
- Database design and scaling strategy
- Real-time communication approach
- CDN and asset management
- Security and authentication
- Deployment and monitoring

Provide detailed reasoning for each architectural decision.`
    }]
  });

  return response;
}

// 8. Code Review Prompts
export const codeReviewPrompts = {
  security: `Review this code for security vulnerabilities:
<code>
[CODE_HERE]
</code>

Check for:
- SQL injection
- XSS vulnerabilities
- Authentication bypasses
- Input validation issues
- Data exposure risks

Provide specific fixes for each issue found.`,

  performance: `Analyze this code for performance bottlenecks:
<code>
[CODE_HERE]
</code>

Look for:
- Inefficient algorithms
- Memory leaks
- Unnecessary computations
- Database query optimization
- Caching opportunities

Suggest concrete optimizations with before/after examples.`,

  architecture: `Review this code architecture:
<code>
[CODE_HERE]
</code>

Evaluate:
- Separation of concerns
- Code reusability
- Maintainability
- Testing strategy
- Error handling

Suggest architectural improvements with reasoning.`
};

// 9. Interactive Development Prompts
export async function interactiveDevelopment() {
  // First message: Initial requirement
  let conversation = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: 'I need to build a todo app with React and TypeScript. Start with the basic component structure.'
    }]
  });

  // Follow-up: Add specific features
  const followUp = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    messages: [
      ...conversation.messages,
      {
        role: 'assistant',
        content: conversation.content[0].text
      },
      {
        role: 'user',
        content: 'Great! Now add functionality for: marking tasks complete, filtering by status, and local storage persistence.'
      }
    ]
  });

  return followUp;
}

// 10. Error Handling and Edge Cases
export const errorHandlingPrompts = {
  comprehensive: `Write a robust error handling system for this API endpoint:
<code>
[API_CODE_HERE]
</code>

Include handling for:
- Network timeouts
- Invalid input data
- Database connection failures
- Authentication errors
- Rate limiting
- Unexpected server errors

Provide logging and monitoring strategies.`,

  testing: `Create comprehensive tests for this function:
<code>
[FUNCTION_CODE_HERE]
</code>

Include:
- Unit tests for happy path
- Edge case scenarios
- Error condition tests
- Performance tests
- Integration tests
- Mock strategies

Use Jest and Testing Library where appropriate.`
};

export {
  structuredPrompt,
  systemPromptExample,
  chainOfThoughtPrompt,
  multishotPrompt,
  prefillResponse,
  complexReasoningPrompt,
  interactiveDevelopment
};