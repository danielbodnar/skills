// DuckDB API Examples - Query Execution and Data Handling

import { DuckDBInstance, DuckDBTypeId } from '@duckdb/node-api';
import { arrayValue, listValue, structValue, mapValue } from '@duckdb/node-api';

const instance = await DuckDBInstance.create();
const connection = await instance.connect();

// Basic query execution methods
const simpleQuery = await connection.run('SELECT 42 as answer');
const queryResult = await connection.runAndReadAll('SELECT * FROM range(5)');

// Parameterized queries with inferred types
const paramQuery = await connection.run('SELECT $1 as name, $2 as age', {
  1: 'Alice',
  2: 30
});

// Named parameters
const namedQuery = await connection.run('SELECT $name, $age, $city', {
  name: 'Bob',
  age: 25,
  city: 'New York'
});

// Prepared statements
const prepared = await connection.prepare('SELECT $1, $2, $3');
prepared.bind({
  1: 'duck',
  2: 42,
  3: listValue([10, 11, 12])
});
const preparedResult = await prepared.run();

// Complex data types
const complexQuery = await connection.run('SELECT $arr, $struct, $map', {
  arr: arrayValue([1, 2, 3]),
  struct: structValue({ name: 'Alice', age: 30 }),
  map: mapValue([['key1', 'value1'], ['key2', 'value2']])
});

// Streaming large results
const stream = await connection.stream('FROM range(1000000)');
const streamReader = await connection.streamAndReadUntil('FROM range(1000000)', 1000);

// Multi-statement execution
const extractedStatements = await connection.extractStatements(`
  CREATE TEMP TABLE test AS SELECT * FROM range(10);
  SELECT * FROM test WHERE range > 5;
  DROP TABLE test;
`);

for (let i = 0; i < extractedStatements.count; i++) {
  const stmt = await extractedStatements.prepare(i);
  const result = await stmt.run();
  console.log(`Statement ${i} result:`, result);
}

// Data inspection and type handling
const reader = await connection.runAndReadAll('SELECT * FROM test_all_types()');
const columnTypes = reader.columnTypes();
const columnNames = reader.columnNames();

columnTypes.forEach((type, index) => {
  console.log(`Column ${columnNames[index]}: ${type.toString()}`);
  
  if (type.typeId === DuckDBTypeId.ARRAY) {
    console.log('  Array value type:', type.valueType);
    console.log('  Array length:', type.length);
  }
  
  if (type.typeId === DuckDBTypeId.STRUCT) {
    console.log('  Struct entry names:', type.names);
    console.log('  Struct entry types:', type.valueTypes);
  }
});

// Result format options
const rows = reader.getRows();
const rowObjects = reader.getRowObjects();
const columns = reader.getColumns();
const columnsObject = reader.getColumnsObject();

// JSON serialization
const rowsJson = reader.getRowsJson();
const rowObjectsJson = reader.getRowObjectsJson();
const columnsJson = reader.getColumnsJson();
const columnsObjectJson = reader.getColumnsObjectJson();