// Observable Framework Configuration Schema

// ============================================================================
// Core Configuration Types
// ============================================================================

export interface ObservableConfig {
  /** The title of the application */
  title?: string;
  
  /** The description of the application */
  description?: string;
  
  /** Pages configuration */
  pages?: Page[];
  
  /** Root directory for source files */
  root?: string;
  
  /** Output directory for built files */
  output?: string;
  
  /** Base path for deployment */
  base?: string;
  
  /** Whether to enable search functionality */
  search?: boolean | SearchConfig;
  
  /** Footer content */
  footer?: string | ((context: PageContext) => string);
  
  /** Custom head content */
  head?: string | ((context: PageContext) => string);
  
  /** Custom CSS styles */
  style?: string;
  
  /** Theme configuration */
  theme?: ThemeConfig;
  
  /** Markdown-it configuration */
  markdownIt?: (md: any) => any;
  
  /** Data loader interpreters */
  interpreters?: Record<string, string[] | null>;
  
  /** DuckDB configuration */
  duckdb?: DuckDBConfig;
  
  /** Dynamic paths for parameterized pages */
  dynamicPaths?: string[] | (() => Promise<string[]>);
  
  /** Build configuration */
  build?: BuildConfig;
  
  /** Development server configuration */
  dev?: DevConfig;
}

// ============================================================================
// Page Configuration
// ============================================================================

export interface Page {
  /** Page name displayed in navigation */
  name: string;
  
  /** Page path (URL) */
  path?: string;
  
  /** Nested pages */
  pages?: Page[];
  
  /** Whether section is open by default */
  open?: boolean;
  
  /** Page description */
  description?: string;
  
  /** Custom metadata */
  metadata?: Record<string, any>;
}

export interface PageContext {
  /** Current page path */
  path: string;
  
  /** Page metadata */
  metadata?: Record<string, any>;
  
  /** Build timestamp */
  timestamp: Date;
}

// ============================================================================
// Search Configuration
// ============================================================================

export interface SearchConfig {
  /** Custom search index generator */
  index?: () => AsyncGenerator<SearchItem>;
  
  /** Search options */
  options?: SearchOptions;
}

export interface SearchItem {
  /** Page path or external URL */
  path: string;
  
  /** Page title */
  title: string;
  
  /** Searchable text content */
  text: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  /** Minimum query length */
  minLength?: number;
  
  /** Maximum results to show */
  maxResults?: number;
  
  /** Search scoring algorithm */
  scoring?: 'tfidf' | 'bm25' | 'simple';
}

// ============================================================================
// Theme Configuration
// ============================================================================

export interface ThemeConfig {
  /** Primary color scheme */
  primary?: string;
  
  /** Secondary color scheme */
  secondary?: string;
  
  /** Background colors */
  background?: {
    light?: string;
    dark?: string;
  };
  
  /** Text colors */
  foreground?: {
    light?: string;
    dark?: string;
  };
  
  /** Font configuration */
  fonts?: {
    sans?: string[];
    mono?: string[];
    serif?: string[];
  };
  
  /** Custom CSS variables */
  variables?: Record<string, string>;
}

// ============================================================================
// DuckDB Configuration  
// ============================================================================

export interface DuckDBConfig {
  /** DuckDB extensions to load */
  extensions?: string[] | Record<string, ExtensionConfig>;
  
  /** Memory limit for DuckDB */
  memory?: string;
  
  /** Number of threads */
  threads?: number;
  
  /** Additional configuration */
  config?: Record<string, any>;
}

export interface ExtensionConfig {
  /** Extension source URL */
  source?: string;
  
  /** Whether to install the extension */
  install?: boolean;
  
  /** Whether to load the extension automatically */
  load?: boolean;
  
  /** Extension configuration */
  config?: Record<string, any>;
}

// ============================================================================
// Build Configuration
// ============================================================================

export interface BuildConfig {
  /** Whether to minify output */
  minify?: boolean;
  
  /** Source map generation */
  sourcemap?: boolean | 'inline' | 'hidden';
  
  /** Bundle splitting strategy */
  splitting?: boolean;
  
  /** External dependencies */
  external?: string[];
  
  /** Plugins */
  plugins?: any[];
  
  /** Build target */
  target?: string[];
  
  /** Define global constants */
  define?: Record<string, string>;
  
  /** Public directory */
  publicDir?: string;
  
  /** Asset handling */
  assets?: AssetConfig;
}

export interface AssetConfig {
  /** File size limit for inlining */
  inlineLimit?: number;
  
  /** Asset naming pattern */
  fileNames?: string;
  
  /** Chunk naming pattern */
  chunkFileNames?: string;
  
  /** Asset directory */
  assetDir?: string;
}

// ============================================================================
// Development Configuration
// ============================================================================

export interface DevConfig {
  /** Development server port */
  port?: number;
  
  /** Server host */
  host?: string | boolean;
  
  /** Whether to open browser automatically */
  open?: boolean | string;
  
  /** CORS configuration */
  cors?: boolean | CorsConfig;
  
  /** Proxy configuration */
  proxy?: Record<string, ProxyConfig>;
  
  /** Hot module replacement */
  hmr?: boolean | HmrConfig;
  
  /** File watching options */
  watch?: WatchConfig;
}

export interface CorsConfig {
  origin?: string | string[] | boolean | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export interface ProxyConfig {
  target: string;
  changeOrigin?: boolean;
  pathRewrite?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface HmrConfig {
  port?: number;
  host?: string;
  clientPort?: number;
}

export interface WatchConfig {
  ignored?: string | string[];
  include?: string | string[];
  exclude?: string | string[];
}

// ============================================================================
// Data Loader Types
// ============================================================================

export interface DataLoaderContext {
  /** Path to the data loader file */
  path: string;
  
  /** Data loader parameters */
  params?: Record<string, string>;
  
  /** Environment variables */
  env: Record<string, string>;
  
  /** Build timestamp */
  timestamp: Date;
}

export type DataLoaderResult = 
  | string 
  | Buffer 
  | Uint8Array 
  | ReadableStream;

export type DataLoader = (context: DataLoaderContext) => Promise<DataLoaderResult>;

// ============================================================================
// File Attachment Types
// ============================================================================

export interface FileAttachmentOptions {
  /** Whether to parse CSV with types */
  typed?: boolean;
  
  /** CSV parsing options */
  delimiter?: string;
  
  /** Array parsing function */
  array?: (text: string) => any[];
  
  /** JSON parsing reviver */
  reviver?: (key: string, value: any) => any;
}

// ============================================================================
// Input Types
// ============================================================================

export interface InputOptions {
  /** Input label */
  label?: string;
  
  /** Input description */
  description?: string;
  
  /** Default value */
  value?: any;
  
  /** Whether input is required */
  required?: boolean;
  
  /** Whether input is disabled */
  disabled?: boolean;
  
  /** Custom attributes */
  attributes?: Record<string, any>;
}

export interface RangeInputOptions extends InputOptions {
  /** Minimum value */
  min?: number;
  
  /** Maximum value */
  max?: number;
  
  /** Step size */
  step?: number;
  
  /** Value formatting function */
  format?: (value: number) => string;
  
  /** Value transform function */
  transform?: (value: number) => number;
}

export interface SelectInputOptions extends InputOptions {
  /** Whether multiple selection is allowed */
  multiple?: boolean;
  
  /** Option formatting function */
  format?: (option: any) => string;
  
  /** Sort function */
  sort?: (a: any, b: any) => number;
  
  /** Unique key function */
  key?: (option: any) => string;
}

export interface TextInputOptions extends InputOptions {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search';
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Pattern for validation */
  pattern?: string;
  
  /** Minimum length */
  minlength?: number;
  
  /** Maximum length */
  maxlength?: number;
  
  /** Whether to resize automatically */
  resize?: boolean;
  
  /** Number of rows (for textarea) */
  rows?: number;
  
  /** Whether spellcheck is enabled */
  spellcheck?: boolean;
}

export interface TableInputOptions extends InputOptions {
  /** Columns to display */
  columns?: string[];
  
  /** Column headers */
  header?: Record<string, string> | boolean;
  
  /** Column widths */
  width?: Record<string, number>;
  
  /** Column alignment */
  align?: Record<string, 'left' | 'center' | 'right'>;
  
  /** Value formatters */
  format?: Record<string, (value: any) => string>;
  
  /** Number of rows per page */
  rows?: number;
  
  /** Whether to show pagination */
  pagination?: boolean;
  
  /** Sort configuration */
  sort?: string | boolean;
  
  /** Whether to reverse sort */
  reverse?: boolean;
  
  /** Whether multiple selection is allowed */
  multiple?: boolean;
  
  /** Layout mode */
  layout?: 'auto' | 'fixed';
  
  /** Maximum width */
  maxWidth?: number;
}

// ============================================================================
// Plot Configuration Types
// ============================================================================

export interface PlotOptions {
  /** Plot width */
  width?: number;
  
  /** Plot height */
  height?: number;
  
  /** Plot aspect ratio */
  aspectRatio?: number;
  
  /** Plot margins */
  margin?: number | {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  
  /** Plot padding */
  padding?: number;
  
  /** Marks to render */
  marks?: any[];
  
  /** Scale configurations */
  x?: ScaleConfig;
  y?: ScaleConfig;
  color?: ScaleConfig;
  r?: ScaleConfig;
  
  /** Facet configuration */
  facet?: FacetConfig;
  
  /** Plot title */
  title?: string;
  
  /** Plot subtitle */
  subtitle?: string;
  
  /** Plot caption */
  caption?: string;
  
  /** Grid configuration */
  grid?: boolean;
  
  /** Background color */
  background?: string;
  
  /** Plot style */
  style?: string | Record<string, string>;
}

export interface ScaleConfig {
  /** Scale type */
  type?: 'linear' | 'log' | 'symlog' | 'sqrt' | 'pow' | 'ordinal' | 'point' | 'band' | 'utc' | 'time';
  
  /** Scale domain */
  domain?: any[];
  
  /** Scale range */
  range?: any[];
  
  /** Whether to use nice ticks */
  nice?: boolean;
  
  /** Number of ticks */
  ticks?: number;
  
  /** Tick values */
  tickValues?: any[];
  
  /** Tick format */
  tickFormat?: string | ((value: any) => string);
  
  /** Tick spacing */
  tickSpacing?: number;
  
  /** Tick size */
  tickSize?: number;
  
  /** Tick padding */
  tickPadding?: number;
  
  /** Axis label */
  label?: string;
  
  /** Label anchor */
  labelAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  
  /** Label offset */
  labelOffset?: number;
  
  /** Whether to show axis */
  axis?: boolean | 'top' | 'right' | 'bottom' | 'left';
  
  /** Whether to reverse scale */
  reverse?: boolean;
  
  /** Scale transform */
  transform?: (value: any) => any;
  
  /** Color scheme (for color scales) */
  scheme?: string;
  
  /** Interpolation function */
  interpolate?: (t: number) => any;
  
  /** Whether to show legend */
  legend?: boolean;
  
  /** Legend position */
  legendPosition?: 'top' | 'right' | 'bottom' | 'left';
  
  /** Zero baseline */
  zero?: boolean;
  
  /** Clamp values to domain */
  clamp?: boolean;
  
  /** Percent formatting */
  percent?: boolean;
}

export interface FacetConfig {
  /** Facet data */
  data?: any[];
  
  /** Horizontal faceting channel */
  x?: string;
  
  /** Vertical faceting channel */
  y?: string;
  
  /** Facet margins */
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

// ============================================================================
// Export Default Schema
// ============================================================================

export default ObservableConfig;