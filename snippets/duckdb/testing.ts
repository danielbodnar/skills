// DuckDB Testing Patterns with Bun Test

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { DuckDBInstance } from '@duckdb/node-api';

describe('DuckDB Integration Tests', () => {
  let instance: any;
  let connection: any;

  beforeAll(async () => {
    // Setup test database
    instance = await DuckDBInstance.create(':memory:');
    connection = await instance.connect();
    
    // Create test tables
    await connection.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name VARCHAR,
        email VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await connection.run(`
      INSERT INTO users (id, name, email) VALUES 
      (1, 'Alice', 'alice@example.com'),
      (2, 'Bob', 'bob@example.com'),
      (3, 'Charlie', 'charlie@example.com')
    `);
  });

  afterAll(async () => {
    // Cleanup
    await connection.close();
    await instance.close();
  });

  test('should connect to database', async () => {
    expect(connection).toBeDefined();
    const result = await connection.run('SELECT 1 as test');
    expect(result).toBeDefined();
  });

  test('should query users table', async () => {
    const reader = await connection.runAndReadAll('SELECT * FROM users');
    const rows = reader.getRows();
    expect(rows).toHaveLength(3);
    expect(rows[0][1]).toBe('Alice');
  });

  test('should handle parameterized queries', async () => {
    const reader = await connection.runAndReadAll(
      'SELECT * FROM users WHERE name = $1', 
      ['Bob']
    );
    const rows = reader.getRows();
    expect(rows).toHaveLength(1);
    expect(rows[0][1]).toBe('Bob');
  });

  test('should handle complex data types', async () => {
    await connection.run(`
      CREATE TEMP TABLE complex_data AS 
      SELECT 
        [1, 2, 3] as array_col,
        {'name': 'test', 'value': 42} as struct_col,
        MAP(['key1', 'key2'], ['val1', 'val2']) as map_col
    `);
    
    const reader = await connection.runAndReadAll('SELECT * FROM complex_data');
    const rows = reader.getRows();
    expect(rows).toHaveLength(1);
  });

  test('should handle transactions', async () => {
    await connection.run('BEGIN TRANSACTION');
    await connection.run('INSERT INTO users (id, name, email) VALUES (4, "Test", "test@example.com")');
    
    let reader = await connection.runAndReadAll('SELECT COUNT(*) FROM users');
    expect(reader.getRows()[0][0]).toBe(4n);
    
    await connection.run('ROLLBACK');
    
    reader = await connection.runAndReadAll('SELECT COUNT(*) FROM users');
    expect(reader.getRows()[0][0]).toBe(3n);
  });

  test('should handle prepared statements', async () => {
    const prepared = await connection.prepare('SELECT * FROM users WHERE id = ?');
    const reader = await prepared.runAndReadAll([2]);
    const rows = reader.getRows();
    expect(rows).toHaveLength(1);
    expect(rows[0][1]).toBe('Bob');
  });

  test('should handle streaming results', async () => {
    const stream = await connection.stream('SELECT * FROM range(1000)');
    expect(stream).toBeDefined();
    
    const streamReader = await connection.streamAndReadUntil('SELECT * FROM range(1000)', 100);
    const rows = streamReader.getRows();
    expect(rows).toHaveLength(100);
  });
});

// Performance testing
describe('DuckDB Performance Tests', () => {
  test('should handle large datasets efficiently', async () => {
    const instance = await DuckDBInstance.create(':memory:', { 
      threads: '4',
      max_memory: '1GB' 
    });
    const connection = await instance.connect();
    
    const startTime = performance.now();
    
    await connection.run('CREATE TABLE large_table AS SELECT * FROM range(1000000)');
    const reader = await connection.runAndReadAll('SELECT COUNT(*) FROM large_table');
    
    const endTime = performance.now();
    
    expect(reader.getRows()[0][0]).toBe(1000000n);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    
    await connection.close();
    await instance.close();
  });
});

// Error handling tests
describe('DuckDB Error Handling', () => {
  test('should handle SQL syntax errors', async () => {
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    
    await expect(connection.run('INVALID SQL SYNTAX')).rejects.toThrow();
    
    await connection.close();
    await instance.close();
  });

  test('should handle connection errors', async () => {
    const instance = await DuckDBInstance.create('/invalid/path/database.db');
    await expect(instance.connect()).rejects.toThrow();
  });
});