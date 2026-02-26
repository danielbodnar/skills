// Typesense Vector Search and Embeddings Examples
import { Client } from 'typesense';

const client = new Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || 'localhost',
    port: Number(process.env.TYPESENSE_PORT) || 8108,
    protocol: 'http'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
  connectionTimeoutSeconds: 10
});

// Schema with different embedding configurations
const documentsSchema = {
  name: 'documents',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'content', type: 'string' },
    { name: 'category', type: 'string', facet: true },
    { name: 'published_date', type: 'int64', sort: true },
    
    // Built-in embedding model
    { 
      name: 'title_embedding', 
      type: 'float[]', 
      embed: {
        from: ['title'],
        model_config: {
          model_name: 'ts/e5-small' // Lightweight built-in model
        }
      }
    },
    
    // Combined content embedding
    { 
      name: 'content_embedding', 
      type: 'float[]', 
      embed: {
        from: ['title', 'content'],
        model_config: {
          model_name: 'ts/all-MiniLM-L6-v2' // Better quality built-in model
        }
      }
    },
    
    // OpenAI embedding (requires API key)
    { 
      name: 'openai_embedding', 
      type: 'float[]', 
      embed: {
        from: ['title', 'content'],
        model_config: {
          model_name: 'openai/text-embedding-3-small',
          api_key: process.env.OPENAI_API_KEY
        }
      },
      optional: true
    }
  ],
  default_sorting_field: 'published_date'
};

// Schema for image search with custom vectors
const imageSchema = {
  name: 'images',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'filename', type: 'string' },
    { name: 'alt_text', type: 'string', optional: true },
    { name: 'tags', type: 'string[]', facet: true },
    { name: 'upload_date', type: 'int64', sort: true },
    
    // Pre-computed image embedding (from CNN model)
    { 
      name: 'image_vector', 
      type: 'float[]',
      num_dim: 512 // Specify dimensions for pre-computed vectors
    },
    
    // Text embedding for alt text search
    { 
      name: 'text_embedding', 
      type: 'float[]', 
      embed: {
        from: ['alt_text'],
        model_config: {
          model_name: 'ts/e5-small'
        }
      },
      optional: true
    }
  ],
  default_sorting_field: 'upload_date'
};

// Create collections with vector search
async function createCollections() {
  try {
    await client.collections().create(documentsSchema);
    console.log('Documents collection created');
    
    await client.collections().create(imageSchema);
    console.log('Images collection created');
  } catch (error: any) {
    if (error.httpStatus === 409) {
      console.log('Collections already exist');
    } else {
      throw error;
    }
  }
}

// Add document with automatic embedding generation
async function addDocument(doc: any) {
  try {
    const result = await client.collections('documents')
      .documents()
      .create({
        ...doc,
        published_date: doc.published_date || Date.now()
      });
    
    console.log(`Document ${result.id} added with embeddings`);
    return result;
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
}

// Add image with pre-computed vector
async function addImage(image: any, imageVector: number[]) {
  try {
    const result = await client.collections('images')
      .documents()
      .create({
        ...image,
        image_vector: imageVector,
        upload_date: image.upload_date || Date.now()
      });
    
    console.log(`Image ${result.id} added with vector`);
    return result;
  } catch (error) {
    console.error('Error adding image:', error);
    throw error;
  }
}

// Pure semantic search using title embeddings
async function searchByTitle(query: string, options: any = {}) {
  try {
    const searchParams = {
      q: query,
      query_by: 'title_embedding',
      filter_by: options.filter_by || '',
      per_page: options.per_page || 10,
      include_fields: 'id,title,content,category',
      exclude_fields: 'title_embedding,content_embedding' // Exclude large vectors
    };

    const results = await client.collections('documents')
      .documents()
      .search(searchParams);
    
    console.log(`Title semantic search found ${results.found} documents`);
    return results;
  } catch (error) {
    console.error('Error in title search:', error);
    throw error;
  }
}

// Semantic search using content embeddings
async function searchByContent(query: string, options: any = {}) {
  try {
    const searchParams = {
      q: query,
      query_by: 'content_embedding',
      filter_by: options.filter_by || '',
      per_page: options.per_page || 10,
      include_fields: 'id,title,content,category'
    };

    const results = await client.collections('documents')
      .documents()
      .search(searchParams);
    
    console.log(`Content semantic search found ${results.found} documents`);
    return results;
  } catch (error) {
    console.error('Error in content search:', error);
    throw error;
  }
}

// Hybrid search combining multiple embeddings and text
async function hybridSearch(query: string, options: any = {}) {
  try {
    const searchParams = {
      q: query,
      query_by: 'title,content,title_embedding,content_embedding',
      query_by_weights: '2,1,3,2', // Weight embeddings higher
      filter_by: options.filter_by || '',
      facet_by: 'category',
      per_page: options.per_page || 20,
      include_fields: 'id,title,content,category',
      highlight_fields: 'title,content',
      highlight_start_tag: '<em>',
      highlight_end_tag: '</em>'
    };

    const results = await client.collections('documents')
      .documents()
      .search(searchParams);
    
    console.log(`Hybrid search found ${results.found} documents`);
    return results;
  } catch (error) {
    console.error('Error in hybrid search:', error);
    throw error;
  }
}

// Vector similarity search with distance threshold
async function findSimilarDocuments(documentId: string, options: any = {}) {
  try {
    // First get the target document's embedding
    const targetDoc = await client.collections('documents')
      .documents(documentId)
      .retrieve();

    // Search for similar documents using vector_query
    const searchParams = {
      q: '*',
      vector_query: `content_embedding:([], k:${options.k || 10}, distance_threshold:${options.threshold || 0.7})`,
      filter_by: `id:!=${documentId}`, // Exclude the target document
      include_fields: 'id,title,content,category',
      per_page: options.per_page || 10
    };

    const results = await client.collections('documents')
      .documents()
      .search(searchParams);
    
    console.log(`Found ${results.found} similar documents`);
    return results;
  } catch (error) {
    console.error('Error finding similar documents:', error);
    throw error;
  }
}

// Image similarity search using pre-computed vectors
async function findSimilarImages(targetVector: number[], options: any = {}) {
  try {
    const searchParams = {
      q: '*',
      vector_query: `image_vector:(${JSON.stringify(targetVector)}, k:${options.k || 10})`,
      filter_by: options.filter_by || '',
      facet_by: 'tags',
      include_fields: 'id,filename,alt_text,tags',
      per_page: options.per_page || 20
    };

    const results = await client.collections('images')
      .documents()
      .search(searchParams);
    
    console.log(`Found ${results.found} similar images`);
    return results;
  } catch (error) {
    console.error('Error in image similarity search:', error);
    throw error;
  }
}

// Multi-vector search across different embedding types
async function multiVectorSearch(query: string, options: any = {}) {
  try {
    const searches = [
      {
        collection: 'documents',
        q: query,
        query_by: 'title_embedding',
        per_page: 5,
        include_fields: 'id,title,category'
      },
      {
        collection: 'documents', 
        q: query,
        query_by: 'content_embedding',
        per_page: 5,
        include_fields: 'id,title,category'
      }
    ];

    if (process.env.OPENAI_API_KEY) {
      searches.push({
        collection: 'documents',
        q: query,
        query_by: 'openai_embedding',
        per_page: 5,
        include_fields: 'id,title,category'
      });
    }

    const results = await client.multi_search({
      searches
    });
    
    console.log(`Multi-vector search completed`);
    return results;
  } catch (error) {
    console.error('Error in multi-vector search:', error);
    throw error;
  }
}

// Configure HNSW parameters for optimal performance
async function updateCollectionForPerformance() {
  try {
    // Update collection to optimize HNSW parameters
    const updateSchema = {
      fields: [
        {
          name: 'content_embedding',
          type: 'float[]',
          hnsw: {
            ef_construction: 400, // Higher = better quality, slower indexing
            M: 32 // Higher = better quality, more memory
          }
        }
      ]
    };

    await client.collections('documents').update(updateSchema);
    console.log('Collection updated with optimized HNSW parameters');
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
}

// Batch operations for large datasets
async function batchAddDocuments(documents: any[]) {
  try {
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      const result = await client.collections('documents')
        .documents()
        .import(batch, { action: 'upsert' });
      
      results.push(result);
      console.log(`Batch ${Math.floor(i / batchSize) + 1} processed`);
    }
    
    return results;
  } catch (error) {
    console.error('Error in batch operation:', error);
    throw error;
  }
}

// Example: Full vector search workflow
async function vectorSearchExample() {
  console.log('=== Vector Search Example ===');
  
  // 1. Create collections
  await createCollections();
  
  // 2. Add sample documents
  const documents = [
    {
      id: '1',
      title: 'Machine Learning Fundamentals',
      content: 'Introduction to supervised and unsupervised learning algorithms',
      category: 'technology'
    },
    {
      id: '2',
      title: 'Deep Learning with Neural Networks',
      content: 'Advanced techniques in artificial intelligence and neural networks',
      category: 'technology'
    },
    {
      id: '3',
      title: 'Cooking Italian Pasta',
      content: 'Traditional recipes and techniques for authentic Italian cuisine',
      category: 'cooking'
    },
    {
      id: '4',
      title: 'Advanced Programming Concepts',
      content: 'Object-oriented programming and design patterns in software development',
      category: 'technology'
    }
  ];

  for (const doc of documents) {
    await addDocument(doc);
  }

  // 3. Add sample image with mock vector
  const mockImageVector = Array.from({ length: 512 }, () => Math.random());
  await addImage({
    id: 'img1',
    filename: 'sunset.jpg',
    alt_text: 'Beautiful sunset over mountains',
    tags: ['nature', 'landscape', 'sunset']
  }, mockImageVector);

  // 4. Perform various vector searches
  console.log('\n--- Semantic Search: "artificial intelligence" ---');
  const aiResults = await searchByContent('artificial intelligence');
  console.log('Results:', aiResults.hits?.map((h: any) => h.document.title));

  console.log('\n--- Hybrid Search: "programming" ---');
  const progResults = await hybridSearch('programming');
  console.log('Results:', progResults.hits?.map((h: any) => h.document.title));

  console.log('\n--- Multi-vector Search: "learning algorithms" ---');
  const multiResults = await multiVectorSearch('learning algorithms');
  console.log('Results from different embeddings:', multiResults.results?.map((r: any) => r.hits?.length));

  console.log('\n--- Similar Images ---');
  const similarImages = await findSimilarImages(mockImageVector, { k: 5 });
  console.log('Similar images found:', similarImages.hits?.length);

  console.log('\n=== Vector Search Example Complete ===');
}

export {
  client,
  documentsSchema,
  imageSchema,
  createCollections,
  addDocument,
  addImage,
  searchByTitle,
  searchByContent,
  hybridSearch,
  findSimilarDocuments,
  findSimilarImages,
  multiVectorSearch,
  updateCollectionForPerformance,
  batchAddDocuments,
  vectorSearchExample
};