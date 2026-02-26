// Observable Framework - Data Loaders Examples

// ============================================================================
// CSV Data Loaders
// ============================================================================

// Basic CSV data loader (data/sales.csv.js)
import {csvFormat} from "d3-dsv";

export const basicCSVLoader = async () => {
  const data = [
    {date: "2024-01", sales: 1000, region: "North"},
    {date: "2024-02", sales: 1200, region: "North"},
    {date: "2024-01", sales: 800, region: "South"},
    {date: "2024-02", sales: 900, region: "South"}
  ];
  
  process.stdout.write(csvFormat(data));
};

// API-based CSV data loader
export const apiCSVLoader = async () => {
  const response = await fetch("https://api.example.com/sales");
  const data = await response.json();
  
  // Transform API data to CSV format
  const transformed = data.map(item => ({
    date: new Date(item.timestamp).toISOString().slice(0, 7),
    revenue: item.amount,
    customer_id: item.customer.id,
    product: item.product.name
  }));
  
  process.stdout.write(csvFormat(transformed));
};

// ============================================================================
// JSON Data Loaders  
// ============================================================================

// Basic JSON data loader (data/config.json.js)
export const basicJSONLoader = async () => {
  const config = {
    apiEndpoint: "https://api.example.com",
    features: {
      realTimeUpdates: true,
      notifications: false
    },
    theme: {
      primaryColor: "#007bff",
      secondaryColor: "#6c757d"
    }
  };
  
  process.stdout.write(JSON.stringify(config, null, 2));
};

// Database JSON data loader
export const databaseJSONLoader = async () => {
  import {Client} from "pg";
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {rejectUnauthorized: false}
  });
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        product_id,
        product_name,
        SUM(quantity * price) as total_revenue,
        COUNT(*) as order_count
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY product_id, product_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `);
    
    process.stdout.write(JSON.stringify(result.rows, null, 2));
  } finally {
    await client.end();
  }
};

// ============================================================================
// Parquet Data Loaders
// ============================================================================

// Generate Parquet from time series data
export const parquetTimeSeriesLoader = async () => {
  import * as Arrow from "apache-arrow";
  import * as Parquet from "parquet-wasm";
  
  // Generate daily random walk data
  const dates = [];
  const values = [];
  const categories = ["A", "B", "C"];
  
  const start = new Date("2023-01-01");
  const end = new Date("2024-01-01");
  
  for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
    for (const category of categories) {
      dates.push(new Date(date));
      values.push(Math.random() * 100);
    }
  }
  
  // Create Arrow table
  const table = Arrow.tableFromArrays({
    date: dates,
    value: values,
    category: categories.flatMap(cat => 
      Array(Math.floor(dates.length / categories.length)).fill(cat)
    )
  });
  
  // Convert to Parquet
  const parquetTable = Parquet.Table.fromIPCStream(Arrow.tableToIPC(table, "stream"));
  const parquetData = Parquet.writeParquet(parquetTable);
  
  process.stdout.write(parquetData);
};

// ============================================================================
// External API Data Loaders
// ============================================================================

// Google Analytics data loader
export const googleAnalyticsLoader = async () => {
  import "dotenv/config";
  import {BetaAnalyticsDataClient} from "@google-analytics/data";
  
  const {GA_PROPERTY_ID, GA_CLIENT_EMAIL, GA_PRIVATE_KEY} = process.env;
  
  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: GA_CLIENT_EMAIL,
      private_key: GA_PRIVATE_KEY
    }
  });
  
  const [response] = await client.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    dateRanges: [{startDate: "30daysAgo", endDate: "today"}],
    dimensions: [{name: "date"}, {name: "country"}],
    metrics: [{name: "activeUsers"}, {name: "sessions"}],
    orderBys: [{dimension: {dimensionName: "date"}}]
  });
  
  const data = response.rows.map(row => ({
    date: row.dimensionValues[0].value,
    country: row.dimensionValues[1].value,
    users: parseInt(row.metricValues[0].value),
    sessions: parseInt(row.metricValues[1].value)
  }));
  
  process.stdout.write(JSON.stringify(data));
};

// GitHub API data loader
export const githubAPILoader = async () => {
  const response = await fetch(
    "https://api.github.com/repos/observablehq/framework/releases",
    {
      headers: {
        "Authorization": `token ${process.env.GITHUB_TOKEN}`,
        "User-Agent": "Observable-Dashboard"
      }
    }
  );
  
  const releases = await response.json();
  
  const data = releases.map(release => ({
    tag: release.tag_name,
    name: release.name,
    published_at: release.published_at,
    download_count: release.assets.reduce((sum, asset) => 
      sum + asset.download_count, 0
    ),
    prerelease: release.prerelease
  }));
  
  process.stdout.write(JSON.stringify(data));
};

// ============================================================================
// Database Data Loaders
// ============================================================================

// PostgreSQL data loader with helper
export const postgresLoader = async () => {
  import "dotenv/config";
  import postgres from "postgres";
  
  const sql = postgres(process.env.DATABASE_URL, {
    ssl: {rejectUnauthorized: false}
  });
  
  try {
    const users = await sql`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as new_users,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '90 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `;
    
    process.stdout.write(JSON.stringify(users));
  } finally {
    await sql.end();
  }
};

// BigQuery data loader
export const bigQueryLoader = async () => {
  import "dotenv/config";
  import {BigQuery} from "@google-cloud/bigquery";
  
  const {BQ_PROJECT_ID, BQ_CLIENT_EMAIL, BQ_PRIVATE_KEY} = process.env;
  
  const bigquery = new BigQuery({
    projectId: BQ_PROJECT_ID,
    credentials: {
      client_email: BQ_CLIENT_EMAIL,
      private_key: BQ_PRIVATE_KEY
    }
  });
  
  const query = `
    SELECT 
      DATE(timestamp) as date,
      COUNT(*) as events,
      COUNT(DISTINCT user_id) as unique_users
    FROM \`project.dataset.events\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
    GROUP BY DATE(timestamp)
    ORDER BY date
  `;
  
  const [rows] = await bigquery.query({query});
  process.stdout.write(JSON.stringify(rows));
};

// ============================================================================
// File Processing Data Loaders
// ============================================================================

// Excel/XLSX data loader
export const excelLoader = async () => {
  import XLSX from "xlsx";
  import {readFile} from "fs/promises";
  
  const buffer = await readFile("input/sales-report.xlsx");
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  // Transform data
  const transformed = data.map(row => ({
    date: new Date(row.Date).toISOString().slice(0, 10),
    product: row["Product Name"],
    revenue: parseFloat(row.Revenue) || 0,
    units_sold: parseInt(row["Units Sold"]) || 0
  }));
  
  process.stdout.write(JSON.stringify(transformed));
};

// ZIP archive data loader
export const zipLoader = async () => {
  import JSZip from "jszip";
  import {readFile} from "fs/promises";
  
  const zipBuffer = await readFile("input/reports.zip");
  const zip = await JSZip.loadAsync(zipBuffer);
  
  const files = {};
  
  // Extract all JSON files
  for (const [filename, file] of Object.entries(zip.files)) {
    if (filename.endsWith(".json") && !file.dir) {
      const content = await file.async("text");
      files[filename] = JSON.parse(content);
    }
  }
  
  process.stdout.write(JSON.stringify(files));
};

// ============================================================================
// Real-time/Streaming Data Loaders
// ============================================================================

// WebSocket data loader (snapshot)
export const websocketSnapshotLoader = async () => {
  import WebSocket from "ws";
  
  return new Promise((resolve, reject) => {
    const data = [];
    const ws = new WebSocket("wss://api.example.com/stream");
    
    const timeout = setTimeout(() => {
      ws.close();
      resolve(data);
    }, 5000); // Collect data for 5 seconds
    
    ws.on("message", (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        data.push({
          timestamp: new Date().toISOString(),
          ...parsed
        });
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    });
    
    ws.on("close", () => {
      clearTimeout(timeout);
      process.stdout.write(JSON.stringify(data));
    });
    
    ws.on("error", reject);
  });
};

// ============================================================================
// Multi-source Data Loaders
// ============================================================================

// Combined data loader (multiple APIs)
export const combinedDataLoader = async () => {
  const [salesResponse, usersResponse, metricsResponse] = await Promise.all([
    fetch("https://api.example.com/sales"),
    fetch("https://api.example.com/users"),
    fetch("https://api.example.com/metrics")
  ]);
  
  const [sales, users, metrics] = await Promise.all([
    salesResponse.json(),
    usersResponse.json(), 
    metricsResponse.json()
  ]);
  
  // Combine and transform data
  const combined = {
    summary: {
      total_sales: sales.reduce((sum, s) => sum + s.amount, 0),
      total_users: users.length,
      last_updated: new Date().toISOString()
    },
    sales: sales.slice(0, 100), // Latest 100 sales
    user_growth: users
      .map(u => ({date: u.created_at.slice(0, 10)}))
      .reduce((acc, u) => {
        acc[u.date] = (acc[u.date] || 0) + 1;
        return acc;
      }, {}),
    metrics: metrics
  };
  
  process.stdout.write(JSON.stringify(combined));
};

// ============================================================================
// Cached Data Loaders
// ============================================================================

// Cache-aware API loader
export const cachedAPILoader = async () => {
  import {existsSync, readFileSync, writeFileSync, statSync} from "fs";
  
  const cacheFile = ".cache/api-data.json";
  const cacheMaxAge = 5 * 60 * 1000; // 5 minutes
  
  // Check if cache exists and is fresh
  if (existsSync(cacheFile)) {
    const stats = statSync(cacheFile);
    const age = Date.now() - stats.mtime.getTime();
    
    if (age < cacheMaxAge) {
      const cached = readFileSync(cacheFile, "utf8");
      process.stdout.write(cached);
      return;
    }
  }
  
  // Fetch fresh data
  const response = await fetch("https://api.example.com/data");
  const data = await response.json();
  const json = JSON.stringify(data);
  
  // Update cache
  writeFileSync(cacheFile, json);
  process.stdout.write(json);
};

// ============================================================================
// Error Handling in Data Loaders
// ============================================================================

// Robust data loader with retries
export const robustDataLoader = async () => {
  const maxRetries = 3;
  const retryDelay = 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.example.com/data", {
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      process.stdout.write(JSON.stringify(data));
      return;
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        // Return fallback data on final failure
        const fallback = {
          error: "Failed to fetch data",
          timestamp: new Date().toISOString(),
          data: []
        };
        process.stdout.write(JSON.stringify(fallback));
        return;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
};