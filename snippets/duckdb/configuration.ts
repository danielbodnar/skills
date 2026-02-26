// DuckDB Configuration Examples

import { DuckDBInstance } from '@duckdb/node-api';

// Configuration options for DuckDB instances
const configOptions = {
  access_mode: 'READ_WRITE', // or 'READ_ONLY'
  threads: '4',
  max_memory: '512MB',
  enable_object_cache: 'true',
  default_order: 'ASC',
  allow_unsigned_extensions: 'true'
};

// Create configured instance
const instance = await DuckDBInstance.create('analytics.db', configOptions);
const connection = await instance.connect();

// Memory-optimized configuration
const memoryOptimized = await DuckDBInstance.create(':memory:', {
  threads: '1',
  max_memory: '256MB',
  memory_limit: '256MB',
  temp_directory: '/tmp/duckdb'
});

// Performance-optimized configuration
const performanceOptimized = await DuckDBInstance.create('performance.db', {
  threads: '8',
  max_memory: '4GB',
  enable_object_cache: 'true',
  checkpoint_threshold: '16MB',
  wal_autocheckpoint: '1000'
});

// Read-only configuration for analytics
const readOnlyAnalytics = await DuckDBInstance.create('readonly.db', {
  access_mode: 'READ_ONLY',
  threads: '16',
  max_memory: '8GB'
});

// Configuration validation
try {
  const instance = await DuckDBInstance.create('test.db', {
    invalid_option: 'value' // This will cause an error
  });
} catch (error: any) {
  console.error('Configuration error:', error.message);
}

// Get available configuration options
const configDescriptions = duckdb.configurationOptionDescriptions();
console.log('Available configurations:', configDescriptions);