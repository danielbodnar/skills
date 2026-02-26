// Advanced DuckDB Patterns and Use Cases

import { DuckDBInstance, DuckDBTypeId } from '@duckdb/node-api';
import { arrayValue, listValue, structValue, mapValue, timestampValue } from '@duckdb/node-api';

const instance = await DuckDBInstance.create('advanced.db', {
  threads: '8',
  max_memory: '4GB',
  enable_object_cache: 'true'
});
const connection = await instance.connect();

// Advanced data type handling
const createComplexSchema = async () => {
  await connection.run(`
    CREATE TABLE complex_data (
      id INTEGER PRIMARY KEY,
      nested_array INTEGER[][],
      user_struct STRUCT(
        name VARCHAR,
        age INTEGER,
        addresses STRUCT(
          home VARCHAR,
          work VARCHAR
        )[]
      ),
      metadata MAP(VARCHAR, VARCHAR),
      time_series STRUCT(
        timestamp TIMESTAMP,
        value DOUBLE
      )[],
      tags VARCHAR[],
      coordinates STRUCT(lat DOUBLE, lng DOUBLE)
    )
  `);
};

// Complex data insertion
const insertComplexData = async () => {
  const appender = await connection.createAppender('complex_data');
  
  // Complex nested data
  appender.appendInteger(1);
  appender.appendValue(arrayValue([
    arrayValue([1, 2, 3]),
    arrayValue([4, 5, 6])
  ]));
  
  appender.appendValue(structValue({
    name: 'Alice Smith',
    age: 30,
    addresses: arrayValue([
      structValue({ home: '123 Main St', work: '456 Office Blvd' }),
      structValue({ home: '789 Second Ave', work: '321 Business Center' })
    ])
  }));
  
  appender.appendValue(mapValue([
    ['department', 'engineering'],
    ['level', 'senior'],
    ['location', 'remote']
  ]));
  
  appender.appendValue(arrayValue([
    structValue({
      timestamp: timestampValue(new Date()),
      value: 42.5
    }),
    structValue({
      timestamp: timestampValue(new Date(Date.now() + 3600000)),
      value: 38.2
    })
  ]));
  
  appender.appendValue(arrayValue(['typescript', 'database', 'analytics']));
  
  appender.appendValue(structValue({
    lat: 40.7128,
    lng: -74.0060
  }));
  
  appender.endRow();
  await appender.flushAsync();
  await appender.close();
};

// Advanced querying patterns
const complexQueries = async () => {
  // Unnesting arrays and structs
  const reader1 = await connection.runAndReadAll(`
    SELECT 
      id,
      user_struct.name,
      user_struct.age,
      UNNEST(user_struct.addresses) as address,
      UNNEST(tags) as tag
    FROM complex_data
  `);
  
  // Working with maps
  const reader2 = await connection.runAndReadAll(`
    SELECT 
      id,
      metadata['department'] as department,
      metadata['level'] as level,
      MAP_KEYS(metadata) as all_keys,
      MAP_VALUES(metadata) as all_values
    FROM complex_data
  `);
  
  // Time series analysis
  const reader3 = await connection.runAndReadAll(`
    SELECT 
      id,
      UNNEST(time_series, recursive := true) as ts_data
    FROM complex_data
  `);
  
  return { unnested: reader1, maps: reader2, timeSeries: reader3 };
};

// Window functions and analytics
const analyticsQueries = async () => {
  // Setup sample data
  await connection.run(`
    CREATE TABLE sales AS
    SELECT 
      range as id,
      ('Product_' || (range % 10)) as product,
      (random() * 1000)::INTEGER as amount,
      DATE '2024-01-01' + INTERVAL (range % 365) DAY as sale_date,
      ['North', 'South', 'East', 'West'][1 + (range % 4)] as region
    FROM range(10000)
  `);
  
  // Running totals and moving averages
  const reader1 = await connection.runAndReadAll(`
    SELECT 
      product,
      sale_date,
      amount,
      SUM(amount) OVER (
        PARTITION BY product 
        ORDER BY sale_date 
        ROWS UNBOUNDED PRECEDING
      ) as running_total,
      AVG(amount) OVER (
        PARTITION BY product 
        ORDER BY sale_date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
      ) as moving_avg_7_days
    FROM sales
    ORDER BY product, sale_date
    LIMIT 100
  `);
  
  // Percentile and ranking functions
  const reader2 = await connection.runAndReadAll(`
    SELECT 
      region,
      product,
      SUM(amount) as total_sales,
      RANK() OVER (PARTITION BY region ORDER BY SUM(amount) DESC) as rank_in_region,
      PERCENT_RANK() OVER (ORDER BY SUM(amount)) as percentile_rank
    FROM sales
    GROUP BY region, product
    ORDER BY region, rank_in_region
  `);
  
  return { trends: reader1, rankings: reader2 };
};

// Dynamic SQL generation
const dynamicQueries = async (filters: any) => {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  
  if (filters.dateRange) {
    whereClause += ' AND sale_date BETWEEN $' + (params.length + 1) + ' AND $' + (params.length + 2);
    params.push(filters.dateRange.start, filters.dateRange.end);
  }
  
  if (filters.regions && filters.regions.length > 0) {
    whereClause += ' AND region = ANY($' + (params.length + 1) + ')';
    params.push(filters.regions);
  }
  
  if (filters.minAmount) {
    whereClause += ' AND amount >= $' + (params.length + 1);
    params.push(filters.minAmount);
  }
  
  const sql = `
    SELECT region, product, SUM(amount) as total
    FROM sales
    ${whereClause}
    GROUP BY region, product
    ORDER BY total DESC
  `;
  
  return await connection.runAndReadAll(sql, params);
};

// Batch processing patterns
const batchProcessor = async (batchSize: number = 10000) => {
  const totalRows = await connection.runAndReadAll('SELECT COUNT(*) FROM sales');
  const total = Number(totalRows.getRows()[0][0]);
  
  const results = [];
  
  for (let offset = 0; offset < total; offset += batchSize) {
    const batch = await connection.runAndReadAll(`
      SELECT * FROM sales
      ORDER BY id
      LIMIT $1 OFFSET $2
    `, [batchSize, offset]);
    
    // Process batch
    const processed = batch.getRows().map(row => ({
      id: row[0],
      product: row[1],
      amount: Number(row[2]),
      processed_at: new Date()
    }));
    
    results.push(...processed);
    console.log(`Processed batch: ${offset + 1} to ${Math.min(offset + batchSize, total)}`);
  }
  
  return results;
};

// Memory-efficient streaming
const streamProcessor = async () => {
  const stream = await connection.stream(`
    SELECT 
      region,
      product,
      sale_date,
      amount,
      ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) as rank
    FROM sales
    WHERE amount > 500
    ORDER BY region, amount DESC
  `);
  
  let processedCount = 0;
  const chunkSize = 1000;
  
  while (true) {
    const chunk = await stream.readChunk(chunkSize);
    if (chunk.length === 0) break;
    
    // Process chunk
    chunk.forEach(row => {
      // Custom processing logic here
      processedCount++;
    });
    
    console.log(`Processed ${processedCount} rows`);
  }
  
  await stream.close();
  return processedCount;
};

// Extension management
const manageExtensions = async () => {
  // Install extensions
  await connection.run("INSTALL httpfs");
  await connection.run("INSTALL spatial");
  await connection.run("INSTALL json");
  
  // Load extensions
  await connection.run("LOAD httpfs");
  await connection.run("LOAD spatial");
  await connection.run("LOAD json");
  
  // Use spatial functions
  const spatialReader = await connection.runAndReadAll(`
    SELECT 
      ST_Point(coordinates.lng, coordinates.lat) as point,
      ST_Distance(
        ST_Point(coordinates.lng, coordinates.lat),
        ST_Point(-74.0060, 40.7128)
      ) as distance_from_nyc
    FROM complex_data
  `);
  
  return spatialReader;
};

// Export all functions
export {
  createComplexSchema,
  insertComplexData,
  complexQueries,
  analyticsQueries,
  dynamicQueries,
  batchProcessor,
  streamProcessor,
  manageExtensions
};