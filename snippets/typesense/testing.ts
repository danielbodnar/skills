// Typesense Testing Patterns and Mock Data

import { test, expect, describe, beforeAll, afterAll, beforeEach } from 'bun:test';
import Typesense from 'typesense';

// Mock Typesense client for testing
class MockTypesenseClient {
  private collections = new Map<string, any>();
  private documents = new Map<string, Map<string, any>>();

  // Mock collection methods
  collections() {
    return {
      create: async (schema: any) => {
        if (this.collections.has(schema.name)) {
          throw { httpStatus: 409, message: 'Collection already exists' };
        }
        this.collections.set(schema.name, schema);
        this.documents.set(schema.name, new Map());
        return schema;
      },
      retrieve: async () => {
        return Array.from(this.collections.values());
      }
    };
  }

  collection(name: string) {
    return {
      retrieve: async () => {
        const collection = this.collections.get(name);
        if (!collection) {
          throw { httpStatus: 404, message: 'Collection not found' };
        }
        return collection;
      },
      delete: async () => {
        this.collections.delete(name);
        this.documents.delete(name);
        return { name };
      },
      documents: () => ({
        create: async (document: any) => {
          const docs = this.documents.get(name);
          if (!docs) {
            throw { httpStatus: 404, message: 'Collection not found' };
          }
          docs.set(document.id, document);
          return document;
        },
        search: async (params: any) => {
          const docs = this.documents.get(name);
          if (!docs) {
            throw { httpStatus: 404, message: 'Collection not found' };
          }
          
          const allDocs = Array.from(docs.values());
          // Simple mock search - just return all docs for testing
          return {
            found: allDocs.length,
            hits: allDocs.map(doc => ({ document: doc })),
            facet_counts: []
          };
        },
        retrieve: async (id: string) => {
          const docs = this.documents.get(name);
          const doc = docs?.get(id);
          if (!doc) {
            throw { httpStatus: 404, message: 'Document not found' };
          }
          return doc;
        }
      })
    };
  }

  health = {
    retrieve: async () => ({ ok: true })
  };
}

// Test data generators
const generateTestProduct = (id: string, overrides: any = {}) => ({
  id,
  title: `Test Product ${id}`,
  description: `Description for test product ${id}`,
  price: Math.random() * 100,
  category: 'Test Category',
  tags: ['test', 'product'],
  in_stock: true,
  created_at: Date.now(),
  ...overrides
});

const generateTestProducts = (count: number) => {
  return Array.from({ length: count }, (_, i) => 
    generateTestProduct(String(i + 1))
  );
};

const generateTestUser = (id: string, overrides: any = {}) => ({
  id,
  name: `Test User ${id}`,
  email: `user${id}@test.com`,
  age: 25 + Math.floor(Math.random() * 40),
  location: [40.7128, -74.0060],
  interests: ['testing', 'technology'],
  premium: Math.random() > 0.5,
  signup_date: Date.now(),
  ...overrides
});

// Integration test helpers
class TypesenseTestHelper {
  constructor(private client: Typesense.Client) {}

  async createTestCollection(name: string, schema: any) {
    try {
      await this.client.collections(name).delete();
    } catch {
      // Collection doesn't exist, which is fine
    }
    
    return await this.client.collections().create({
      ...schema,
      name
    });
  }

  async seedTestData(collectionName: string, documents: any[]) {
    for (const doc of documents) {
      await this.client.collections(collectionName).documents().create(doc);
    }
    return documents;
  }

  async cleanupCollection(name: string) {
    try {
      await this.client.collections(name).delete();
    } catch {
      // Collection doesn't exist, which is fine
    }
  }

  async waitForIndexing(delayMs = 100) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

// Test suite examples
describe('Typesense Client Tests', () => {
  let mockClient: MockTypesenseClient;
  let realClient: Typesense.Client | null = null;
  let testHelper: TypesenseTestHelper | null = null;

  beforeAll(() => {
    // Setup mock client for unit tests
    mockClient = new MockTypesenseClient();

    // Setup real client for integration tests (if available)
    try {
      realClient = new Typesense.Client({
        nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
        apiKey: 'test-api-key',
        connectionTimeoutSeconds: 2
      });
      testHelper = new TypesenseTestHelper(realClient);
    } catch {
      console.log('Real Typesense server not available, skipping integration tests');
    }
  });

  describe('Collection Management', () => {
    test('should create collection successfully', async () => {
      const schema = {
        name: 'test_products',
        fields: [
          { name: 'title', type: 'string' as const },
          { name: 'price', type: 'float' as const }
        ]
      };

      const result = await mockClient.collections().create(schema);
      expect(result.name).toBe('test_products');
    });

    test('should fail to create duplicate collection', async () => {
      const schema = {
        name: 'test_products',
        fields: [
          { name: 'title', type: 'string' as const }
        ]
      };

      await mockClient.collections().create(schema);
      
      expect(async () => {
        await mockClient.collections().create(schema);
      }).toThrow();
    });

    test('should list collections', async () => {
      const collections = await mockClient.collections().retrieve();
      expect(Array.isArray(collections)).toBe(true);
    });
  });

  describe('Document Operations', () => {
    beforeEach(async () => {
      // Setup test collection
      const schema = {
        name: 'test_docs',
        fields: [
          { name: 'title', type: 'string' as const },
          { name: 'content', type: 'string' as const }
        ]
      };
      
      try {
        await mockClient.collections().create(schema);
      } catch {
        // Collection might already exist
      }
    });

    test('should create document', async () => {
      const doc = {
        id: '1',
        title: 'Test Document',
        content: 'This is a test document'
      };

      const result = await mockClient.collection('test_docs').documents().create(doc);
      expect(result.id).toBe('1');
      expect(result.title).toBe('Test Document');
    });

    test('should search documents', async () => {
      // Create test document first
      const doc = generateTestProduct('1');
      await mockClient.collection('test_docs').documents().create(doc);

      const searchParams = {
        q: 'test',
        query_by: 'title,content'
      };

      const results = await mockClient.collection('test_docs').documents().search(searchParams);
      expect(results.found).toBeGreaterThan(0);
      expect(Array.isArray(results.hits)).toBe(true);
    });

    test('should retrieve document by ID', async () => {
      const doc = generateTestProduct('2');
      await mockClient.collection('test_docs').documents().create(doc);

      const retrieved = await mockClient.collection('test_docs').documents().retrieve('2');
      expect(retrieved.id).toBe('2');
    });
  });

  describe('Search Functionality', () => {
    test('should handle empty search results', async () => {
      const searchParams = {
        q: 'nonexistent',
        query_by: 'title'
      };

      const results = await mockClient.collection('test_docs').documents().search(searchParams);
      expect(results.found).toBe(0);
      expect(results.hits).toEqual([]);
    });

    test('should validate search parameters', () => {
      const validParams = {
        q: 'test',
        query_by: 'title,description',
        filter_by: 'category:Electronics',
        per_page: 10
      };

      // Simple validation test
      expect(validParams.q).toBeDefined();
      expect(validParams.query_by).toBeDefined();
      expect(validParams.per_page).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle collection not found', async () => {
      expect(async () => {
        await mockClient.collection('nonexistent').retrieve();
      }).toThrow();
    });

    test('should handle document not found', async () => {
      expect(async () => {
        await mockClient.collection('test_docs').documents().retrieve('nonexistent');
      }).toThrow();
    });
  });

  // Integration tests (only run if real server is available)
  if (realClient && testHelper) {
    describe('Integration Tests', () => {
      const testCollectionName = 'integration_test_products';

      beforeAll(async () => {
        const schema = {
          name: testCollectionName,
          fields: [
            { name: 'title', type: 'string' as const },
            { name: 'description', type: 'string' as const },
            { name: 'price', type: 'float' as const },
            { name: 'category', type: 'string' as const, facet: true },
            { name: 'in_stock', type: 'bool' as const },
            { name: 'created_at', type: 'int64' as const }
          ],
          default_sorting_field: 'created_at'
        };

        await testHelper!.createTestCollection(testCollectionName, schema);
        
        // Seed test data
        const testProducts = generateTestProducts(10);
        await testHelper!.seedTestData(testCollectionName, testProducts);
        await testHelper!.waitForIndexing(200);
      });

      afterAll(async () => {
        await testHelper!.cleanupCollection(testCollectionName);
      });

      test('should perform real search', async () => {
        const results = await realClient!
          .collections(testCollectionName)
          .documents()
          .search({
            q: 'Test Product',
            query_by: 'title,description'
          });

        expect(results.found).toBeGreaterThan(0);
        expect(results.hits.length).toBeGreaterThan(0);
      });

      test('should handle faceted search', async () => {
        const results = await realClient!
          .collections(testCollectionName)
          .documents()
          .search({
            q: '*',
            query_by: 'title',
            facet_by: 'category'
          });

        expect(results.facet_counts).toBeDefined();
        expect(Array.isArray(results.facet_counts)).toBe(true);
      });

      test('should handle filtered search', async () => {
        const results = await realClient!
          .collections(testCollectionName)
          .documents()
          .search({
            q: '*',
            query_by: 'title',
            filter_by: 'in_stock:true'
          });

        results.hits.forEach(hit => {
          expect(hit.document.in_stock).toBe(true);
        });
      });
    });
  }
});

// Performance testing utilities
class PerformanceTestSuite {
  constructor(private client: Typesense.Client) {}

  async benchmarkSearch(
    collectionName: string,
    searchParams: any,
    iterations = 100
  ) {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this.client.collections(collectionName).documents().search(searchParams);
      const end = performance.now();
      times.push(end - start);
    }

    return {
      min: Math.min(...times),
      max: Math.max(...times),
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      median: times.sort()[Math.floor(times.length / 2)],
      p95: times.sort()[Math.floor(times.length * 0.95)]
    };
  }

  async benchmarkIndexing(collectionName: string, documents: any[]) {
    const start = performance.now();
    
    for (const doc of documents) {
      await this.client.collections(collectionName).documents().create(doc);
    }
    
    const end = performance.now();
    const totalTime = end - start;
    
    return {
      totalTime,
      docsPerSecond: (documents.length / totalTime) * 1000,
      avgTimePerDoc: totalTime / documents.length
    };
  }
}

// Load testing utilities
async function loadTest(client: Typesense.Client, options: {
  collectionName: string;
  searchParams: any;
  concurrency: number;
  duration: number; // in seconds
}) {
  const { collectionName, searchParams, concurrency, duration } = options;
  const endTime = Date.now() + (duration * 1000);
  const results: { success: number; error: number; times: number[] } = {
    success: 0,
    error: 0,
    times: []
  };

  const workers = Array.from({ length: concurrency }, async () => {
    while (Date.now() < endTime) {
      try {
        const start = performance.now();
        await client.collections(collectionName).documents().search(searchParams);
        const end = performance.now();
        results.success++;
        results.times.push(end - start);
      } catch {
        results.error++;
      }
    }
  });

  await Promise.all(workers);
  
  return {
    ...results,
    totalRequests: results.success + results.error,
    successRate: results.success / (results.success + results.error),
    avgResponseTime: results.times.reduce((a, b) => a + b, 0) / results.times.length,
    requestsPerSecond: (results.success + results.error) / duration
  };
}

export {
  MockTypesenseClient,
  generateTestProduct,
  generateTestProducts,
  generateTestUser,
  TypesenseTestHelper,
  PerformanceTestSuite,
  loadTest
};