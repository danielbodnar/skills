// Typesense Conversational Search (RAG) Examples
import { Client } from 'typesense';

const client = new Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || 'localhost',
    port: Number(process.env.TYPESENSE_PORT) || 8108,
    protocol: 'http'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
  connectionTimeoutSeconds: 15
});

// Knowledge base schema optimized for RAG
const knowledgeBaseSchema = {
  name: 'knowledge_base',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string', facet: false },
    { name: 'content', type: 'string', facet: false },
    { name: 'summary', type: 'string', facet: false, optional: true },
    { name: 'category', type: 'string', facet: true },
    { name: 'tags', type: 'string[]', facet: true, optional: true },
    { name: 'source_url', type: 'string', facet: false, optional: true },
    { name: 'author', type: 'string', facet: true, optional: true },
    { name: 'published_date', type: 'int64', sort: true },
    { name: 'last_updated', type: 'int64', sort: true },
    { name: 'word_count', type: 'int32', sort: true, optional: true },
    { name: 'difficulty_level', type: 'string', facet: true, optional: true },
    
    // Embedding for semantic search in RAG context
    { 
      name: 'content_embedding', 
      type: 'float[]', 
      embed: {
        from: ['title', 'content', 'summary'],
        model_config: {
          model_name: 'ts/all-MiniLM-L6-v2' // Good balance of quality and speed
        }
      }
    }
  ],
  default_sorting_field: 'last_updated'
};

// Conversation schema to track chat history
const conversationSchema = {
  name: 'conversations',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'session_id', type: 'string', facet: true },
    { name: 'user_message', type: 'string' },
    { name: 'assistant_response', type: 'string' },
    { name: 'context_documents', type: 'string[]', optional: true },
    { name: 'timestamp', type: 'int64', sort: true },
    { name: 'response_time_ms', type: 'int32', optional: true },
    { name: 'rating', type: 'int32', facet: true, optional: true }, // 1-5 user rating
    { name: 'model_used', type: 'string', facet: true, optional: true }
  ],
  default_sorting_field: 'timestamp'
};

async function createKnowledgeBase() {
  try {
    await client.collections().create(knowledgeBaseSchema);
    await client.collections().create(conversationSchema);
    console.log('Knowledge base and conversation collections created');
  } catch (error: any) {
    if (error.httpStatus === 409) {
      console.log('Collections already exist');
    } else {
      throw error;
    }
  }
}

// Add knowledge base document
async function addKnowledgeDocument(doc: any) {
  try {
    const result = await client.collections('knowledge_base')
      .documents()
      .create({
        ...doc,
        published_date: doc.published_date || Date.now(),
        last_updated: doc.last_updated || Date.now(),
        word_count: doc.content?.split(' ').length || 0
      });
    
    console.log(`Knowledge document ${result.id} added`);
    return result;
  } catch (error) {
    console.error('Error adding knowledge document:', error);
    throw error;
  }
}

// Retrieve relevant context for RAG
async function getRelevantContext(query: string, options: any = {}) {
  try {
    const searchParams = {
      q: query,
      query_by: 'content_embedding,title,content',
      query_by_weights: '3,2,1', // Prioritize semantic similarity
      filter_by: options.filter_by || '',
      facet_by: 'category,difficulty_level',
      per_page: options.max_context_docs || 5,
      include_fields: 'id,title,content,summary,category,source_url,author',
      highlight_fields: 'content',
      highlight_start_tag: '**',
      highlight_end_tag: '**',
      highlight_affix_num_tokens: 3
    };

    const results = await client.collections('knowledge_base')
      .documents()
      .search(searchParams);
    
    console.log(`Found ${results.found} relevant context documents`);
    return results.hits || [];
  } catch (error) {
    console.error('Error retrieving context:', error);
    throw error;
  }
}

// Basic conversational search using built-in RAG
async function basicConversationalSearch(userQuery: string, sessionId: string, options: any = {}) {
  try {
    const startTime = Date.now();
    
    // Build conversation context from history
    const conversationHistory = await getConversationHistory(sessionId, 5);
    
    const conversationRequest = {
      model: options.model || 'openai/gpt-3.5-turbo',
      context: options.context || 'You are a helpful assistant that answers questions based on the provided knowledge base. Always cite your sources.',
      conversation: [
        ...conversationHistory,
        { role: 'user', content: userQuery }
      ],
      search_config: {
        collection: 'knowledge_base',
        query_by: 'content_embedding,title,content',
        filter_by: options.filter_by || '',
        per_page: 5
      }
    };

    const response = await client.conversations.create(conversationRequest);
    const responseTime = Date.now() - startTime;
    
    // Store conversation
    await storeConversation({
      session_id: sessionId,
      user_message: userQuery,
      assistant_response: response.conversation[response.conversation.length - 1].content,
      context_documents: response.context_documents?.map((doc: any) => doc.id) || [],
      response_time_ms: responseTime,
      model_used: options.model || 'openai/gpt-3.5-turbo'
    });

    return response;
  } catch (error) {
    console.error('Error in conversational search:', error);
    throw error;
  }
}

// Advanced RAG with custom context processing
async function advancedRAG(userQuery: string, sessionId: string, options: any = {}) {
  try {
    const startTime = Date.now();
    
    // 1. Get relevant context documents
    const contextHits = await getRelevantContext(userQuery, {
      max_context_docs: options.max_context_docs || 5,
      filter_by: options.filter_by
    });
    
    // 2. Process and rank context documents
    const processedContext = contextHits.map((hit: any) => {
      const doc = hit.document;
      const highlights = hit.highlights || [];
      
      return {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        summary: doc.summary,
        relevance_score: hit.text_match_score || 0,
        highlights: highlights.map((h: any) => h.snippet).join(' ... '),
        source: doc.source_url || '',
        author: doc.author || ''
      };
    });
    
    // 3. Build enhanced prompt with context
    const contextText = processedContext.map(ctx => 
      `Source: ${ctx.title} (${ctx.author || 'Unknown'})\n${ctx.content}\n---`
    ).join('\n');
    
    const enhancedPrompt = `
Context Documents:
${contextText}

Based on the above context, please answer the following question. Always cite specific sources when possible:

Question: ${userQuery}
    `.trim();
    
    // 4. Get conversation history for continuity
    const conversationHistory = await getConversationHistory(sessionId, 3);
    
    // 5. Make API call to LLM (example with OpenAI format)
    const llmResponse = await callLLM({
      model: options.model || 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: options.system_prompt || 'You are a helpful assistant that answers questions based on provided context. Always cite your sources and be honest when information is not available in the context.'
        },
        ...conversationHistory,
        { role: 'user', content: enhancedPrompt }
      ],
      max_tokens: options.max_tokens || 500,
      temperature: options.temperature || 0.7
    });
    
    const responseTime = Date.now() - startTime;
    
    // 6. Store conversation with metadata
    await storeConversation({
      session_id: sessionId,
      user_message: userQuery,
      assistant_response: llmResponse.content,
      context_documents: processedContext.map(ctx => ctx.id),
      response_time_ms: responseTime,
      model_used: options.model || 'gpt-3.5-turbo'
    });
    
    return {
      response: llmResponse.content,
      context_used: processedContext,
      response_time_ms: responseTime,
      model_used: options.model || 'gpt-3.5-turbo'
    };
  } catch (error) {
    console.error('Error in advanced RAG:', error);
    throw error;
  }
}

// Multi-turn conversation with context awareness
async function multiTurnConversation(userQuery: string, sessionId: string, options: any = {}) {
  try {
    // Get recent conversation history
    const history = await getConversationHistory(sessionId, 10);
    
    // Combine current query with recent context for better search
    const expandedQuery = history.length > 0 
      ? `${history.slice(-2).map((h: any) => h.content).join(' ')} ${userQuery}`
      : userQuery;
    
    // Get context based on expanded query
    const contextHits = await getRelevantContext(expandedQuery, options);
    
    // Build conversation with full history and context
    const response = await basicConversationalSearch(userQuery, sessionId, {
      ...options,
      context: `You are a helpful assistant. Use the conversation history to maintain context and provide coherent responses. Previous conversation context should inform your current response.`
    });
    
    return response;
  } catch (error) {
    console.error('Error in multi-turn conversation:', error);
    throw error;
  }
}

// Store conversation turn
async function storeConversation(conversation: any) {
  try {
    const result = await client.collections('conversations')
      .documents()
      .create({
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...conversation,
        timestamp: Date.now()
      });
    
    return result;
  } catch (error) {
    console.error('Error storing conversation:', error);
    throw error;
  }
}

// Get conversation history for a session
async function getConversationHistory(sessionId: string, limit: number = 5) {
  try {
    const results = await client.collections('conversations')
      .documents()
      .search({
        q: '*',
        filter_by: `session_id:${sessionId}`,
        sort_by: 'timestamp:desc',
        per_page: limit * 2, // Get both user and assistant messages
        include_fields: 'user_message,assistant_response,timestamp'
      });
    
    // Convert to conversation format
    const history: any[] = [];
    results.hits?.forEach((hit: any) => {
      const doc = hit.document;
      history.push(
        { role: 'user', content: doc.user_message },
        { role: 'assistant', content: doc.assistant_response }
      );
    });
    
    return history.reverse().slice(-limit * 2); // Most recent first, then limit
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

// Mock LLM API call (replace with actual OpenAI/Anthropic/etc. API)
async function callLLM(request: any) {
  // This is a mock implementation - replace with actual LLM API call
  console.log('Calling LLM with:', request.messages[request.messages.length - 1].content.substring(0, 100) + '...');
  
  // Simulate API response
  return {
    content: `Based on the provided context, I can help answer your question. However, this is a mock response. In a real implementation, you would call your preferred LLM API (OpenAI, Anthropic, etc.) here.`,
    model: request.model,
    usage: {
      prompt_tokens: 150,
      completion_tokens: 50,
      total_tokens: 200
    }
  };
}

// Analytics and conversation insights
async function getConversationAnalytics(sessionId?: string, timeRange?: any) {
  try {
    let filter = '';
    if (sessionId) filter += `session_id:${sessionId}`;
    if (timeRange) {
      const timeFilter = `timestamp:>=${timeRange.start} && timestamp:<=${timeRange.end}`;
      filter = filter ? `${filter} && ${timeFilter}` : timeFilter;
    }
    
    const results = await client.collections('conversations')
      .documents()
      .search({
        q: '*',
        filter_by: filter,
        facet_by: 'rating,model_used',
        per_page: 0, // Just get facets and stats
        max_facet_values: 20
      });
    
    // Calculate average response time
    const statsResults = await client.collections('conversations')
      .documents()
      .search({
        q: '*',
        filter_by: filter,
        per_page: 1000,
        include_fields: 'response_time_ms,rating'
      });
    
    const responseTimes = statsResults.hits?.map((h: any) => h.document.response_time_ms).filter(Boolean) || [];
    const ratings = statsResults.hits?.map((h: any) => h.document.rating).filter(Boolean) || [];
    
    return {
      total_conversations: results.found,
      avg_response_time: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b) / responseTimes.length : 0,
      avg_rating: ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0,
      facets: results.facet_counts
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
}

// Example: Complete RAG workflow
async function ragExample() {
  console.log('=== RAG (Conversational Search) Example ===');
  
  // 1. Setup knowledge base
  await createKnowledgeBase();
  
  // 2. Add sample knowledge documents
  const knowledgeDocs = [
    {
      id: 'doc1',
      title: 'TypeScript Best Practices',
      content: 'TypeScript is a strongly typed programming language that builds on JavaScript. Best practices include using strict mode, proper type annotations, and leveraging advanced features like generics.',
      summary: 'Guide to TypeScript development best practices',
      category: 'programming',
      tags: ['typescript', 'javascript', 'best-practices'],
      author: 'Tech Expert',
      difficulty_level: 'intermediate'
    },
    {
      id: 'doc2',
      title: 'Vector Search with Typesense',
      content: 'Typesense supports vector search and semantic search using embeddings. You can use built-in models or connect to external APIs like OpenAI for generating embeddings.',
      summary: 'How to implement vector search in Typesense',
      category: 'search',
      tags: ['typesense', 'vector-search', 'embeddings'],
      author: 'Search Engineer',
      difficulty_level: 'advanced'
    },
    {
      id: 'doc3',
      title: 'Building RAG Applications',
      content: 'Retrieval-Augmented Generation combines information retrieval with language model generation. The key is to retrieve relevant context and provide it to the language model for accurate responses.',
      summary: 'Guide to building RAG applications',
      category: 'ai',
      tags: ['rag', 'llm', 'retrieval'],
      author: 'AI Researcher',
      difficulty_level: 'advanced'
    }
  ];
  
  for (const doc of knowledgeDocs) {
    await addKnowledgeDocument(doc);
  }
  
  const sessionId = `session_${Date.now()}`;
  
  // 3. Simulate conversation
  console.log('\n--- Question 1: TypeScript basics ---');
  const response1 = await advancedRAG(
    'What are the best practices for TypeScript development?',
    sessionId,
    { max_context_docs: 3 }
  );
  console.log('Response:', response1.response.substring(0, 150) + '...');
  console.log('Context used:', response1.context_used.map(ctx => ctx.title));
  
  console.log('\n--- Question 2: Follow-up question ---');
  const response2 = await multiTurnConversation(
    'Can you give me specific examples of those practices?',
    sessionId
  );
  console.log('Follow-up handled with conversation context');
  
  console.log('\n--- Question 3: Different topic ---');
  const response3 = await advancedRAG(
    'How do I implement semantic search?',
    sessionId,
    { filter_by: 'category:search' }
  );
  console.log('Filtered search response generated');
  
  // 4. Get analytics
  console.log('\n--- Conversation Analytics ---');
  const analytics = await getConversationAnalytics(sessionId);
  console.log('Session analytics:', {
    total_conversations: analytics.total_conversations,
    avg_response_time: `${analytics.avg_response_time}ms`
  });
  
  console.log('\n=== RAG Example Complete ===');
}

export {
  client,
  knowledgeBaseSchema,
  conversationSchema,
  createKnowledgeBase,
  addKnowledgeDocument,
  getRelevantContext,
  basicConversationalSearch,
  advancedRAG,
  multiTurnConversation,
  storeConversation,
  getConversationHistory,
  getConversationAnalytics,
  ragExample
};