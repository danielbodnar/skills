// Basic DuckDB Node.js Usage Examples

import duckdb from '@duckdb/node-api';
import { DuckDBInstance } from '@duckdb/node-api';

// Getting version and configuration info
console.log('DuckDB Version:', duckdb.version());
console.log('Config Options:', duckdb.configurationOptionDescriptions());

// Create instance and connection
const instance = await DuckDBInstance.create();
const connection = await instance.connect();

// Simple query execution
const result = await connection.run("SELECT 'Hello DuckDB!' as message");
console.log('Simple query result:', result);

// Query with results
const reader = await connection.runAndReadAll('SELECT 1 as id, "Alice" as name');
const rows = reader.getRows();
console.log('Query rows:', rows);

// File-based database
const fileInstance = await DuckDBInstance.create('my_database.db');
const fileConnection = await fileInstance.connect();

// In-memory database with configuration
const configuredInstance = await DuckDBInstance.create(':memory:', {
  threads: '4',
  max_memory: '1GB'
});

// Close connections
await connection.close();
await instance.close();