// DuckDB TypeScript Type Definitions

declare module '@duckdb/node-api' {
  // Main DuckDB class
  export default class DuckDB {
    static version(): string;
    static configurationOptionDescriptions(): ConfigOptionDescription[];
  }

  // Instance management
  export class DuckDBInstance {
    static create(path?: string, config?: DuckDBConfig): Promise<DuckDBInstance>;
    connect(): Promise<DuckDBConnection>;
    close(): Promise<void>;
  }

  // Connection interface
  export class DuckDBConnection {
    run(sql: string, params?: any[]): Promise<DuckDBResult>;
    runAndReadAll(sql: string, params?: any[]): Promise<DuckDBResultReader>;
    stream(sql: string, params?: any[]): Promise<DuckDBStreamResult>;
    streamAndReadUntil(sql: string, limit: number, params?: any[]): Promise<DuckDBResultReader>;
    prepare(sql: string): Promise<DuckDBPreparedStatement>;
    extractStatements(sql: string): Promise<DuckDBExtractedStatements>;
    createAppender(table: string, schema?: string): Promise<DuckDBAppender>;
    close(): Promise<void>;
  }

  // Configuration types
  export interface DuckDBConfig {
    access_mode?: 'READ_ONLY' | 'READ_WRITE';
    threads?: string;
    max_memory?: string;
    memory_limit?: string;
    temp_directory?: string;
    checkpoint_threshold?: string;
    wal_autocheckpoint?: string;
    enable_object_cache?: 'true' | 'false';
    enable_external_access?: 'true' | 'false';
    allow_unsigned_extensions?: 'true' | 'false';
    default_order?: 'ASC' | 'DESC';
    preserve_insertion_order?: 'true' | 'false';
    enable_profiling?: 'true' | 'false';
    enable_progress_bar?: 'true' | 'false';
    force_compression?: string;
    experimental_parallel_csv?: 'true' | 'false';
    [key: string]: string | undefined;
  }

  // Configuration option description
  export interface ConfigOptionDescription {
    name: string;
    description: string;
    default_value: string;
  }

  // Type system
  export enum DuckDBTypeId {
    INVALID = 0,
    BOOLEAN = 1,
    TINYINT = 2,
    SMALLINT = 3,
    INTEGER = 4,
    BIGINT = 5,
    UTINYINT = 6,
    USMALLINT = 7,
    UINTEGER = 8,
    UBIGINT = 9,
    FLOAT = 10,
    DOUBLE = 11,
    TIMESTAMP = 12,
    DATE = 13,
    TIME = 14,
    INTERVAL = 15,
    HUGEINT = 16,
    VARCHAR = 17,
    BLOB = 18,
    DECIMAL = 19,
    TIMESTAMP_S = 20,
    TIMESTAMP_MS = 21,
    TIMESTAMP_NS = 22,
    ENUM = 23,
    ARRAY = 24,
    STRUCT = 25,
    MAP = 26,
    UUID = 27,
    UNION = 28,
    BIT = 29,
    TIME_TZ = 30,
    TIMESTAMP_TZ = 31,
  }

  // Type interfaces
  export interface DuckDBType {
    typeId: DuckDBTypeId;
    alias?: string;
    toString(): string;
  }

  export interface DuckDBArrayType extends DuckDBType {
    valueType: DuckDBType;
    length: number;
  }

  export interface DuckDBListType extends DuckDBType {
    valueType: DuckDBType;
  }

  export interface DuckDBStructType extends DuckDBType {
    names: string[];
    valueTypes: DuckDBType[];
  }

  export interface DuckDBMapType extends DuckDBType {
    keyType: DuckDBType;
    valueType: DuckDBType;
  }

  export interface DuckDBDecimalType extends DuckDBType {
    width: number;
    scale: number;
  }

  export interface DuckDBEnumType extends DuckDBType {
    values: string[];
  }

  export interface DuckDBUnionType extends DuckDBType {
    memberTags: string[];
    memberTypes: DuckDBType[];
  }

  // Value types
  export interface DuckDBValue {
    toString(): string;
  }

  export interface DuckDBArrayValue extends DuckDBValue {
    items: any[];
  }

  export interface DuckDBBitValue extends DuckDBValue {
    toBools(): boolean[];
    toBits(): number[];
  }

  export interface DuckDBBlobValue extends DuckDBValue {
    bytes: Uint8Array;
  }

  export interface DuckDBDateValue extends DuckDBValue {
    days: number;
    toParts(): { year: number; month: number; day: number };
  }

  export interface DuckDBDecimalValue extends DuckDBValue {
    value: bigint;
    width: number;
    scale: number;
    toDouble(): number;
  }

  export interface DuckDBIntervalValue extends DuckDBValue {
    months: number;
    days: number;
    micros: bigint;
  }

  export interface DuckDBListValue extends DuckDBValue {
    items: any[];
  }

  export interface DuckDBMapValue extends DuckDBValue {
    entries: Array<{ key: any; value: any }>;
  }

  export interface DuckDBStructValue extends DuckDBValue {
    entries: Record<string, any>;
  }

  export interface DuckDBTimestampValue extends DuckDBValue {
    micros: bigint;
    toParts(): {
      date: { year: number; month: number; day: number };
      time: { hour: number; min: number; sec: number; micros: number };
    };
  }

  export interface DuckDBTimeValue extends DuckDBValue {
    micros: bigint;
    toParts(): { hour: number; min: number; sec: number; micros: number };
  }

  export interface DuckDBUnionValue extends DuckDBValue {
    tag: string;
    value: any;
  }

  export interface DuckDBUUIDValue extends DuckDBValue {
    hugeint: bigint;
  }

  // Result interfaces
  export interface DuckDBResult {
    // Basic result interface
  }

  export interface DuckDBResultReader {
    columnCount(): number;
    columnNames(): string[];
    columnTypes(): DuckDBType[];
    columnNameAndTypeObjects(): Array<{ name: string; type: DuckDBType }>;
    columnNameAndTypeObjectsJson(): { columnNames: string[]; columnTypes: any[] };
    columnNamesAndTypesJson(): { columnNames: string[]; columnTypes: any[] };
    getRows(): any[][];
    getRowObjects(): Record<string, any>[];
    getColumns(): any[][];
    getColumnsObject(): Record<string, any[]>;
    getRowsJson(): any[][];
    getRowObjectsJson(): Record<string, any>[];
    getColumnsJson(): any[][];
    getColumnsObjectJson(): Record<string, any[]>;
    visitRows(callback: (row: any[], rowIndex: number) => void): void;
    visitColumns(callback: (column: any[], columnIndex: number, type: DuckDBType) => void): void;
    visitRowMajor(callback: (value: any, rowIndex: number, columnIndex: number, type: DuckDBType) => void): void;
    visitColumnMajor(callback: (value: any, rowIndex: number, columnIndex: number, type: DuckDBType) => void): void;
  }

  export interface DuckDBStreamResult {
    readChunk(size: number): Promise<any[][]>;
    close(): Promise<void>;
  }

  // Prepared statements
  export interface DuckDBPreparedStatement {
    parameterCount: number;
    bind(params: Record<string, any>, types?: Record<string, DuckDBType>): void;
    bindInteger(index: number, value: number): void;
    bindVarchar(index: number, value: string): void;
    bindDouble(index: number, value: number): void;
    bindBoolean(index: number, value: boolean): void;
    bindTimestamp(index: number, value: DuckDBTimestampValue): void;
    bindDecimal(index: number, value: DuckDBDecimalValue): void;
    run(): Promise<DuckDBResult>;
    runAndReadAll(): Promise<DuckDBResultReader>;
    close(): Promise<void>;
  }

  // Extracted statements
  export interface DuckDBExtractedStatements {
    count: number;
    prepare(index: number): Promise<DuckDBPreparedStatement>;
    close(): Promise<void>;
  }

  // Appender interface
  export interface DuckDBAppender {
    appendBoolean(value: boolean): void;
    appendInteger(value: number): void;
    appendBigint(value: bigint): void;
    appendDouble(value: number): void;
    appendVarchar(value: string): void;
    appendDate(value: DuckDBDateValue): void;
    appendTimestamp(value: DuckDBTimestampValue): void;
    appendTime(value: DuckDBTimeValue): void;
    appendDecimal(value: DuckDBDecimalValue): void;
    appendValue(value: any): void;
    endRow(): void;
    flushSync(): void;
    flushAsync(): Promise<void>;
    close(): Promise<void>;
  }

  // Data type constructors
  export function arrayValue(items: any[]): DuckDBArrayValue;
  export function listValue(items: any[]): DuckDBListValue;
  export function structValue(object: Record<string, any>): DuckDBStructValue;
  export function mapValue(entries: Array<[any, any]>): DuckDBMapValue;
  export function timestampValue(date: Date): DuckDBTimestampValue;
  export function dateValue(date: Date): DuckDBDateValue;
  export function timeValue(date: Date): DuckDBTimeValue;
  export function decimalValue(value: number | string, width: number, scale: number): DuckDBDecimalValue;
  export function intervalValue(months: number, days: number, micros: bigint): DuckDBIntervalValue;
  export function uuidValue(uuid: string): DuckDBUUIDValue;

  // Type constructors for binding
  export const BOOLEAN: DuckDBType;
  export const TINYINT: DuckDBType;
  export const SMALLINT: DuckDBType;
  export const INTEGER: DuckDBType;
  export const BIGINT: DuckDBType;
  export const FLOAT: DuckDBType;
  export const DOUBLE: DuckDBType;
  export const VARCHAR: DuckDBType;
  export const BLOB: DuckDBType;
  export const DATE: DuckDBType;
  export const TIME: DuckDBType;
  export const TIMESTAMP: DuckDBType;
  export const UUID: DuckDBType;

  export function DECIMAL(width: number, scale: number): DuckDBDecimalType;
  export function ARRAY(valueType: DuckDBType, length?: number): DuckDBArrayType;
  export function LIST(valueType: DuckDBType): DuckDBListType;
  export function STRUCT(entries: Record<string, DuckDBType>): DuckDBStructType;
  export function MAP(keyType: DuckDBType, valueType: DuckDBType): DuckDBMapType;
  export function ENUM(values: string[]): DuckDBEnumType;
  export function UNION(members: Record<string, DuckDBType>): DuckDBUnionType;
}