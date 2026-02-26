// Typesense Collection Management Examples

import Typesense from 'typesense';

// Basic collection schema
const basicProductSchema = {
  name: 'products',
  fields: [
    { name: 'title', type: 'string' as const },
    { name: 'description', type: 'string' as const },
    { name: 'price', type: 'float' as const },
    { name: 'category', type: 'string' as const, facet: true },
    { name: 'tags', type: 'string[]' as const, facet: true },
    { name: 'in_stock', type: 'bool' as const },
    { name: 'created_at', type: 'int64' as const }
  ],
  default_sorting_field: 'created_at'
};

// Advanced collection schema with embeddings
const advancedProductSchema = {
  name: 'products_advanced',
  fields: [
    { name: 'title', type: 'string' as const },
    { name: 'description', type: 'string' as const },
    { name: 'price', type: 'float' as const },
    { name: 'category', type: 'string' as const, facet: true },
    { name: 'brand', type: 'string' as const, facet: true },
    { name: 'tags', type: 'string[]' as const, facet: true },
    { name: 'colors', type: 'string[]' as const, facet: true },
    { name: 'sizes', type: 'string[]' as const, facet: true },
    { name: 'rating', type: 'float' as const },
    { name: 'review_count', type: 'int32' as const },
    { name: 'in_stock', type: 'bool' as const },
    { name: 'location', type: 'geopoint' as const },
    { name: 'created_at', type: 'int64' as const },
    { name: 'updated_at', type: 'int64' as const },
    // Vector embedding field
    {
      name: 'embedding',
      type: 'float[]' as const,
      embed: {
        from: ['title', 'description'],
        model_config: {
          model_name: 'ts/all-MiniLM-L12-v2'
        }
      }
    }
  ],
  default_sorting_field: 'created_at',
  token_separators: ['-', '_'],
  symbols_to_index: ['@', '#'],
  enable_nested_fields: true
};

// User collection schema
const userSchema = {
  name: 'users',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'name', type: 'string' as const },
    { name: 'email', type: 'string' as const },
    { name: 'age', type: 'int32' as const },
    { name: 'location', type: 'geopoint' as const },
    { name: 'interests', type: 'string[]' as const, facet: true },
    { name: 'premium', type: 'bool' as const },
    { name: 'signup_date', type: 'int64' as const }
  ],
  default_sorting_field: 'signup_date'
};

// Article/Blog collection schema
const articleSchema = {
  name: 'articles',
  fields: [
    { name: 'title', type: 'string' as const },
    { name: 'content', type: 'string' as const },
    { name: 'excerpt', type: 'string' as const },
    { name: 'author', type: 'string' as const, facet: true },
    { name: 'categories', type: 'string[]' as const, facet: true },
    { name: 'tags', type: 'string[]' as const, facet: true },
    { name: 'published_at', type: 'int64' as const },
    { name: 'reading_time', type: 'int32' as const },
    { name: 'view_count', type: 'int32' as const },
    { name: 'featured', type: 'bool' as const },
    { name: 'slug', type: 'string' as const }
  ],
  default_sorting_field: 'published_at'
};

// Collection management functions
class CollectionManager {
  constructor(private client: Typesense.Client) {}

  // Create collection with error handling
  async createCollection(schema: any) {
    try {
      const collection = await this.client.collections().create(schema);
      console.log(`Collection '${schema.name}' created successfully`);
      return collection;
    } catch (error: any) {
      if (error.httpStatus === 409) {
        console.log(`Collection '${schema.name}' already exists`);
        return await this.client.collections(schema.name).retrieve();
      }
      throw error;
    }
  }

  // List all collections
  async listCollections() {
    try {
      const collections = await this.client.collections().retrieve();
      console.log('Available collections:', collections.map(c => c.name));
      return collections;
    } catch (error) {
      console.error('Failed to list collections:', error);
      throw error;
    }
  }

  // Get collection details
  async getCollection(name: string) {
    try {
      const collection = await this.client.collections(name).retrieve();
      console.log(`Collection '${name}' details:`, collection);
      return collection;
    } catch (error) {
      console.error(`Failed to get collection '${name}':`, error);
      throw error;
    }
  }

  // Update collection schema
  async updateCollection(name: string, updates: any) {
    try {
      const result = await this.client.collections(name).update(updates);
      console.log(`Collection '${name}' updated successfully`);
      return result;
    } catch (error) {
      console.error(`Failed to update collection '${name}':`, error);
      throw error;
    }
  }

  // Delete collection
  async deleteCollection(name: string) {
    try {
      await this.client.collections(name).delete();
      console.log(`Collection '${name}' deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete collection '${name}':`, error);
      throw error;
    }
  }

  // Create collection if it doesn't exist
  async ensureCollection(schema: any) {
    try {
      return await this.client.collections(schema.name).retrieve();
    } catch (error: any) {
      if (error.httpStatus === 404) {
        return await this.createCollection(schema);
      }
      throw error;
    }
  }

  // Recreate collection (delete and create)
  async recreateCollection(schema: any) {
    try {
      await this.deleteCollection(schema.name);
    } catch (error: any) {
      // Ignore if collection doesn't exist
      if (error.httpStatus !== 404) {
        throw error;
      }
    }
    return await this.createCollection(schema);
  }
}

// Schema validation helper
function validateSchema(schema: any) {
  const errors: string[] = [];

  if (!schema.name || typeof schema.name !== 'string') {
    errors.push('Collection name is required and must be a string');
  }

  if (!schema.fields || !Array.isArray(schema.fields)) {
    errors.push('Fields array is required');
  } else {
    schema.fields.forEach((field: any, index: number) => {
      if (!field.name || typeof field.name !== 'string') {
        errors.push(`Field ${index}: name is required and must be a string`);
      }
      
      const validTypes = [
        'string', 'int32', 'int64', 'float', 'bool', 'geopoint',
        'string[]', 'int32[]', 'int64[]', 'float[]', 'bool[]', 'geopoint[]'
      ];
      
      if (!field.type || !validTypes.includes(field.type)) {
        errors.push(`Field ${field.name}: invalid type '${field.type}'`);
      }
    });
  }

  if (schema.default_sorting_field) {
    const sortField = schema.fields?.find((f: any) => f.name === schema.default_sorting_field);
    if (!sortField) {
      errors.push(`default_sorting_field '${schema.default_sorting_field}' not found in fields`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Example usage
async function collectionExamples(client: Typesense.Client) {
  const manager = new CollectionManager(client);

  // Validate schemas before creating
  const basicValidation = validateSchema(basicProductSchema);
  if (!basicValidation.isValid) {
    console.error('Basic schema validation failed:', basicValidation.errors);
    return;
  }

  // Create collections
  await manager.ensureCollection(basicProductSchema);
  await manager.ensureCollection(advancedProductSchema);
  await manager.ensureCollection(userSchema);
  await manager.ensureCollection(articleSchema);

  // List all collections
  await manager.listCollections();

  // Get collection details
  await manager.getCollection('products');
}

export {
  basicProductSchema,
  advancedProductSchema,
  userSchema,
  articleSchema,
  CollectionManager,
  validateSchema,
  collectionExamples
};