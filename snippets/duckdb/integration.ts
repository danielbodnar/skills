// DuckDB Integration Examples with Other Tools

import { DuckDBInstance } from '@duckdb/node-api';
import { Hono } from 'hono';

// Web API Integration with Hono
const app = new Hono();
let dbInstance: any;
let dbConnection: any;

// Initialize database
const initializeDB = async () => {
  dbInstance = await DuckDBInstance.create('api_data.db', {
    threads: '4',
    max_memory: '2GB'
  });
  dbConnection = await dbInstance.connect();
  
  // Create tables
  await dbConnection.run(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY,
      event_name VARCHAR,
      user_id INTEGER,
      properties JSON,
      timestamp TIMESTAMP DEFAULT NOW()
    )
  `);
};

// API endpoints
app.get('/analytics/events', async (c) => {
  try {
    const reader = await dbConnection.runAndReadAll(`
      SELECT event_name, COUNT(*) as count 
      FROM analytics 
      GROUP BY event_name 
      ORDER BY count DESC
    `);
    return c.json(reader.getRowObjectsJson());
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/analytics/track', async (c) => {
  try {
    const body = await c.req.json();
    await dbConnection.run(`
      INSERT INTO analytics (event_name, user_id, properties) 
      VALUES ($1, $2, $3)
    `, [body.event_name, body.user_id, JSON.stringify(body.properties)]);
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// File processing integration
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const processCSVFiles = async (directoryPath: string) => {
  const instance = await DuckDBInstance.create('csv_data.db');
  const connection = await instance.connect();
  
  const files = await readdir(directoryPath);
  const csvFiles = files.filter(file => file.endsWith('.csv'));
  
  for (const file of csvFiles) {
    const filePath = join(directoryPath, file);
    const tableName = file.replace('.csv', '');
    
    // Import CSV directly
    await connection.run(`
      CREATE TABLE ${tableName} AS 
      SELECT * FROM read_csv_auto('${filePath}')
    `);
    
    console.log(`Imported ${file} as table ${tableName}`);
  }
  
  // Analyze all imported data
  const reader = await connection.runAndReadAll(`
    SELECT table_name, COUNT(*) as row_count
    FROM information_schema.tables 
    WHERE table_schema = 'main'
  `);
  
  console.log('Table summary:', reader.getRowObjectsJson());
  
  await connection.close();
  await instance.close();
};

// Parquet file processing
const processParquetFiles = async (s3Path: string) => {
  const instance = await DuckDBInstance.create(':memory:');
  const connection = await instance.connect();
  
  // Install and load httpfs extension for S3 access
  await connection.run("INSTALL httpfs");
  await connection.run("LOAD httpfs");
  
  // Query Parquet files directly from S3
  const reader = await connection.runAndReadAll(`
    SELECT COUNT(*) as total_records
    FROM read_parquet('${s3Path}/*.parquet')
  `);
  
  console.log('Parquet records:', reader.getRows()[0][0]);
  
  await connection.close();
  await instance.close();
};

// JSON data processing
const processJSONData = async (apiEndpoint: string) => {
  const instance = await DuckDBInstance.create('json_data.db');
  const connection = await instance.connect();
  
  // Fetch data from API
  const response = await fetch(apiEndpoint);
  const jsonData = await response.json();
  
  // Create temporary JSON file
  await Bun.write('temp_data.json', JSON.stringify(jsonData));
  
  // Import JSON data
  await connection.run(`
    CREATE TABLE api_data AS 
    SELECT * FROM read_json_auto('temp_data.json')
  `);
  
  // Analyze JSON structure
  const reader = await connection.runAndReadAll(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'api_data'
  `);
  
  console.log('JSON data structure:', reader.getRowObjectsJson());
  
  await connection.close();
  await instance.close();
};

// Real-time data processing with streaming
const processStreamingData = async () => {
  const instance = await DuckDBInstance.create('streaming.db');
  const connection = await instance.connect();
  
  await connection.run(`
    CREATE TABLE events (
      id INTEGER PRIMARY KEY,
      data JSON,
      processed_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Simulate streaming data processing
  const processChunk = async (data: any[]) => {
    const appender = await connection.createAppender('events');
    
    for (const item of data) {
      appender.appendInteger(item.id);
      appender.appendVarchar(JSON.stringify(item.data));
      appender.endRow();
    }
    
    await appender.flushAsync();
    await appender.close();
  };
  
  // Process data in batches
  const batchSize = 1000;
  for (let i = 0; i < 10000; i += batchSize) {
    const batch = Array.from({ length: batchSize }, (_, j) => ({
      id: i + j,
      data: { value: Math.random(), timestamp: new Date() }
    }));
    
    await processChunk(batch);
    console.log(`Processed batch starting at ${i}`);
  }
  
  await connection.close();
  await instance.close();
};

// Export functions
export { 
  initializeDB, 
  app, 
  processCSVFiles, 
  processParquetFiles, 
  processJSONData, 
  processStreamingData 
};