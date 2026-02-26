// Typesense Document Management Examples

import Typesense from 'typesense';

// Sample documents for different collections
const sampleProducts = [
  {
    id: '1',
    title: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 99.99,
    category: 'Electronics',
    tags: ['audio', 'wireless', 'bluetooth'],
    in_stock: true,
    created_at: Date.now()
  },
  {
    id: '2',
    title: 'Running Shoes',
    description: 'Comfortable running shoes for daily exercise',
    price: 79.99,
    category: 'Sports',
    tags: ['shoes', 'running', 'fitness'],
    in_stock: true,
    created_at: Date.now()
  }
];

const sampleUsers = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    location: [40.7128, -74.0060], // NYC coordinates
    interests: ['technology', 'sports', 'music'],
    premium: true,
    signup_date: Date.now() - 86400000 // 1 day ago
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 25,
    location: [34.0522, -118.2437], // LA coordinates
    interests: ['photography', 'travel', 'food'],
    premium: false,
    signup_date: Date.now() - 172800000 // 2 days ago
  }
];

// Document operations class
class DocumentManager {
  constructor(private client: Typesense.Client) {}

  // Create single document
  async createDocument(collectionName: string, document: any) {
    try {
      const result = await this.client
        .collections(collectionName)
        .documents()
        .create(document);
      console.log(`Document ${document.id} created in ${collectionName}`);
      return result;
    } catch (error) {
      console.error(`Failed to create document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Upsert document (create or update)
  async upsertDocument(collectionName: string, document: any) {
    try {
      const result = await this.client
        .collections(collectionName)
        .documents()
        .upsert(document);
      console.log(`Document ${document.id} upserted in ${collectionName}`);
      return result;
    } catch (error) {
      console.error(`Failed to upsert document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Update document
  async updateDocument(collectionName: string, id: string, updates: any) {
    try {
      const result = await this.client
        .collections(collectionName)
        .documents(id)
        .update(updates);
      console.log(`Document ${id} updated in ${collectionName}`);
      return result;
    } catch (error) {
      console.error(`Failed to update document ${id} in ${collectionName}:`, error);
      throw error;
    }
  }

  // Get document by ID
  async getDocument(collectionName: string, id: string) {
    try {
      const document = await this.client
        .collections(collectionName)
        .documents(id)
        .retrieve();
      console.log(`Retrieved document ${id} from ${collectionName}`);
      return document;
    } catch (error) {
      console.error(`Failed to get document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete document
  async deleteDocument(collectionName: string, id: string) {
    try {
      await this.client
        .collections(collectionName)
        .documents(id)
        .delete();
      console.log(`Document ${id} deleted from ${collectionName}`);
    } catch (error) {
      console.error(`Failed to delete document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  // Batch import documents
  async importDocuments(collectionName: string, documents: any[], options = {}) {
    try {
      const defaultOptions = {
        action: 'create',
        batch_size: 100,
        ...options
      };

      const result = await this.client
        .collections(collectionName)
        .documents()
        .import(documents, defaultOptions);

      console.log(`Imported ${documents.length} documents to ${collectionName}`);
      return result;
    } catch (error) {
      console.error(`Failed to import documents to ${collectionName}:`, error);
      throw error;
    }
  }

  // Export all documents
  async exportDocuments(collectionName: string) {
    try {
      const documents = await this.client
        .collections(collectionName)
        .documents()
        .export();

      console.log(`Exported documents from ${collectionName}`);
      return documents;
    } catch (error) {
      console.error(`Failed to export documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Bulk operations with error handling
  async bulkUpsert(collectionName: string, documents: any[]) {
    const results = {
      successful: [] as any[],
      failed: [] as any[]
    };

    for (const document of documents) {
      try {
        const result = await this.upsertDocument(collectionName, document);
        results.successful.push({ document, result });
      } catch (error) {
        results.failed.push({ document, error });
      }
    }

    console.log(`Bulk upsert completed: ${results.successful.length} successful, ${results.failed.length} failed`);
    return results;
  }

  // Delete documents by filter
  async deleteByFilter(collectionName: string, filterBy: string) {
    try {
      const result = await this.client
        .collections(collectionName)
        .documents()
        .delete({ filter_by: filterBy });

      console.log(`Deleted documents from ${collectionName} with filter: ${filterBy}`);
      return result;
    } catch (error) {
      console.error(`Failed to delete documents by filter in ${collectionName}:`, error);
      throw error;
    }
  }
}

// Document validation helpers
function validateProduct(product: any) {
  const errors: string[] = [];

  if (!product.id) errors.push('Product ID is required');
  if (!product.title || typeof product.title !== 'string') errors.push('Title is required and must be a string');
  if (typeof product.price !== 'number' || product.price < 0) errors.push('Price must be a positive number');
  if (!product.category) errors.push('Category is required');
  if (typeof product.in_stock !== 'boolean') errors.push('in_stock must be a boolean');

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateUser(user: any) {
  const errors: string[] = [];

  if (!user.id) errors.push('User ID is required');
  if (!user.name || typeof user.name !== 'string') errors.push('Name is required and must be a string');
  if (!user.email || !user.email.includes('@')) errors.push('Valid email is required');
  if (typeof user.age !== 'number' || user.age < 0 || user.age > 150) errors.push('Age must be a valid number');
  if (!Array.isArray(user.location) || user.location.length !== 2) errors.push('Location must be [lat, lng] array');
  if (!Array.isArray(user.interests)) errors.push('Interests must be an array');

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Batch processing utilities
class BatchProcessor {
  constructor(private client: Typesense.Client, private batchSize = 100) {}

  async processBatch(collectionName: string, documents: any[], action: 'create' | 'upsert' | 'update' = 'create') {
    const batches = this.createBatches(documents, this.batchSize);
    const results = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} with ${batch.length} documents`);

      try {
        const result = await this.client
          .collections(collectionName)
          .documents()
          .import(batch, { action });

        results.push(result);
        
        // Add delay between batches to avoid overwhelming the server
        if (i < batches.length - 1) {
          await this.delay(100);
        }
      } catch (error) {
        console.error(`Batch ${i + 1} failed:`, error);
        results.push({ error });
      }
    }

    return results;
  }

  private createBatches(documents: any[], batchSize: number) {
    const batches = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      batches.push(documents.slice(i, i + batchSize));
    }
    return batches;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Document transformation utilities
function transformProduct(rawProduct: any) {
  return {
    id: String(rawProduct.id),
    title: rawProduct.title?.trim() || '',
    description: rawProduct.description?.trim() || '',
    price: parseFloat(rawProduct.price) || 0,
    category: rawProduct.category?.trim() || 'Uncategorized',
    tags: Array.isArray(rawProduct.tags) ? rawProduct.tags : [],
    in_stock: Boolean(rawProduct.in_stock),
    created_at: rawProduct.created_at || Date.now()
  };
}

function transformUser(rawUser: any) {
  return {
    id: String(rawUser.id),
    name: rawUser.name?.trim() || '',
    email: rawUser.email?.toLowerCase().trim() || '',
    age: parseInt(rawUser.age) || 0,
    location: Array.isArray(rawUser.location) ? rawUser.location : [0, 0],
    interests: Array.isArray(rawUser.interests) ? rawUser.interests : [],
    premium: Boolean(rawUser.premium),
    signup_date: rawUser.signup_date || Date.now()
  };
}

// Example usage
async function documentExamples(client: Typesense.Client) {
  const docManager = new DocumentManager(client);
  const batchProcessor = new BatchProcessor(client, 50);

  // Create individual documents
  for (const product of sampleProducts) {
    const validation = validateProduct(product);
    if (validation.isValid) {
      await docManager.createDocument('products', product);
    } else {
      console.error('Product validation failed:', validation.errors);
    }
  }

  // Batch import users
  const transformedUsers = sampleUsers.map(transformUser);
  await batchProcessor.processBatch('users', transformedUsers, 'upsert');

  // Update a document
  await docManager.updateDocument('products', '1', {
    price: 89.99,
    tags: ['audio', 'wireless', 'bluetooth', 'sale']
  });

  // Get a document
  const product = await docManager.getDocument('products', '1');
  console.log('Retrieved product:', product);

  // Export documents
  const allProducts = await docManager.exportDocuments('products');
  console.log('All products:', allProducts);
}

export {
  sampleProducts,
  sampleUsers,
  DocumentManager,
  validateProduct,
  validateUser,
  BatchProcessor,
  transformProduct,
  transformUser,
  documentExamples
};