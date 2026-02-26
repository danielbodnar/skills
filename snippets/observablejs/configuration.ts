// Observable Framework - Configuration Examples

// ============================================================================
// Framework Configuration (observablehq.config.js)
// ============================================================================

// Basic configuration
export const basicConfig = {
  title: "My Data Dashboard",
  pages: [
    {name: "Home", path: "/"},
    {name: "Analytics", path: "/analytics"},
    {name: "Reports", path: "/reports"}
  ]
};

// Advanced configuration with sections
export const advancedConfig = {
  title: "Enterprise Dashboard",
  pages: [
    {
      name: "Analytics",
      path: "/analytics/",
      pages: [
        {name: "Sales", path: "/analytics/sales"},
        {name: "Users", path: "/analytics/users"},
        {name: "Revenue", path: "/analytics/revenue"}
      ]
    },
    {
      name: "Reports",
      open: false, // Collapsed by default
      pages: [
        {name: "Monthly", path: "/reports/monthly"},
        {name: "Quarterly", path: "/reports/quarterly"}
      ]
    }
  ],
  root: "src",
  output: "dist",
  search: true
};

// Configuration with custom footer
export const configWithFooter = {
  title: "Data Portal",
  footer: "Built with Observable Framework",
  pages: [
    {name: "Dashboard", path: "/dashboard"}
  ]
};

// Configuration with dynamic footer
export const configWithDynamicFooter = {
  title: "Analytics Platform",
  footer: ({path}) => `<a href="https://github.com/company/analytics/blob/main/src${path}.md">View source</a>`,
  pages: [
    {name: "Overview", path: "/overview"}
  ]
};

// ============================================================================
// Data Loader Interpreters Configuration
// ============================================================================

// Add custom interpreters
export const customInterpreters = {
  interpreters: {
    ".pl": ["perl"],
    ".scpt": ["osascript"],
    ".jl": ["julia"]
  }
};

// Disable specific interpreters
export const disabledInterpreters = {
  interpreters: {
    ".rs": null, // Disable Rust interpreter
    ".py": null  // Disable Python interpreter
  }
};

// Default interpreter configuration
export const defaultInterpreters = {
  ".js": ["node", "--no-warnings=ExperimentalWarning"],
  ".ts": ["tsx"],
  ".py": ["python3"],
  ".r": ["Rscript"],
  ".R": ["Rscript"],
  ".rs": ["rust-script"],
  ".go": ["go", "run"],
  ".java": ["java"],
  ".jl": ["julia"],
  ".php": ["php"],
  ".sh": ["sh"],
  ".exe": []
};

// ============================================================================
// Markdown-it Plugin Configuration
// ============================================================================

import MarkdownItFootnote from "markdown-it-footnote";
import MarkdownItContainer from "markdown-it-container";

// Add footnote support
export const markdownWithFootnotes = {
  markdownIt: (md) => md.use(MarkdownItFootnote)
};

// Add custom containers
export const markdownWithContainers = {
  markdownIt: (md) =>
    md
      .use(MarkdownItContainer, "card")
      .use(MarkdownItContainer, "tip")
      .use(MarkdownItContainer, "warning")
};

// ============================================================================
// DuckDB Configuration
// ============================================================================

// Simple DuckDB extensions
export const duckdbSimple = {
  duckdb: {
    extensions: ["spatial", "h3"]
  }
};

// Detailed DuckDB configuration
export const duckdbDetailed = {
  duckdb: {
    extensions: {
      spatial: {
        source: "https://extensions.duckdb.org/",
        install: true,
        load: true
      },
      h3: {
        source: "https://community-extensions.duckdb.org/",
        install: true,
        load: true
      }
    }
  }
};

// ============================================================================
// Search Configuration
// ============================================================================

// Basic search
export const basicSearch = {
  search: true
};

// Custom search with external links
export const customSearch = {
  search: {
    async *index() {
      // Add external documentation links
      yield {
        path: "https://observablehq.com/framework/",
        title: "Observable Framework Documentation",
        text: "Official documentation for Observable Framework"
      };
      yield {
        path: "https://observablehq.com/plot/",
        title: "Observable Plot Documentation", 
        text: "Grammar of graphics for data visualization"
      };
    }
  }
};

// ============================================================================
// Dynamic Paths Configuration  
// ============================================================================

// Static dynamic paths
export const staticDynamicPaths = {
  dynamicPaths: [
    "/products/100736",
    "/products/221797", 
    "/products/399145"
  ]
};

// Function-based dynamic paths
export const functionDynamicPaths = {
  async dynamicPaths() {
    const products = await fetch("/api/products").then(r => r.json());
    return products.map(p => `/products/${p.id}`);
  }
};

// ============================================================================
// Style Configuration
// ============================================================================

// Custom CSS
export const customStyles = {
  style: `
    .dashboard-card {
      border: 1px solid var(--theme-foreground-muted);
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }
    
    .metric-large {
      font-size: 2rem;
      font-weight: bold;
      color: var(--theme-foreground-focus);
    }
  `
};

// ============================================================================
// Environment-specific Configuration
// ============================================================================

// Development configuration
export const developmentConfig = {
  title: "Dashboard (Dev)",
  search: true,
  pages: [
    {name: "Debug", path: "/debug"},
    {name: "Analytics", path: "/analytics"}
  ]
};

// Production configuration
export const productionConfig = {
  title: "Analytics Dashboard",
  search: false, // Disable search in production
  pages: [
    {name: "Overview", path: "/"},
    {name: "Analytics", path: "/analytics"}
  ],
  style: `
    /* Production optimized styles */
    .chart { will-change: transform; }
  `
};

// ============================================================================
// Complete Configuration Examples
// ============================================================================

// E-commerce dashboard
export const ecommerceConfig = {
  title: "E-commerce Analytics",
  description: "Real-time sales and customer analytics",
  pages: [
    {name: "Overview", path: "/"},
    {
      name: "Sales",
      pages: [
        {name: "Revenue", path: "/sales/revenue"},
        {name: "Products", path: "/sales/products"},
        {name: "Customers", path: "/sales/customers"}
      ]
    },
    {
      name: "Marketing",
      pages: [
        {name: "Campaigns", path: "/marketing/campaigns"},
        {name: "Conversion", path: "/marketing/conversion"}
      ]
    }
  ],
  search: {
    async *index() {
      yield {
        path: "/help",
        title: "Help Documentation",
        text: "Get help with using the dashboard"
      };
    }
  },
  footer: "© 2024 Company Inc. | Built with Observable Framework"
};

// Scientific research dashboard
export const researchConfig = {
  title: "Research Data Portal",
  pages: [
    {name: "Experiments", path: "/experiments"},
    {name: "Results", path: "/results"},
    {name: "Publications", path: "/publications"}
  ],
  duckdb: {
    extensions: ["spatial", "parquet"]
  },
  interpreters: {
    ".py": ["python3"],
    ".r": ["Rscript"],
    ".jl": ["julia"]
  },
  markdownIt: (md) => md.use(MarkdownItFootnote)
};

// ============================================================================
// Export Module Configuration
// ============================================================================

// Configuration for external module embedding
export const moduleExportConfig = {
  dynamicPaths: [
    "/chart.js",
    "/components/sales-chart.js",
    "/components/user-metrics.js"
  ]
};