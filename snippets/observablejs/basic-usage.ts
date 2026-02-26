// Observable Framework - Basic Usage Examples

// ============================================================================
// Basic Framework Setup
// ============================================================================

// observablehq.config.js - Basic configuration
export default {
  title: "My Data Dashboard",
  pages: [
    {name: "Overview", path: "/overview"},
    {name: "Analysis", path: "/analysis"},
    {name: "Settings", path: "/settings"}
  ],
  root: "src",
  output: "dist"
};

// ============================================================================
// Basic Markdown Page with JavaScript
// ============================================================================

/*
# Sales Dashboard

Here's our sales data visualization:

```js
// Load data
const sales = FileAttachment("data/sales.csv").csv({typed: true});

// Create basic chart
Plot.plot({
  marks: [
    Plot.barY(sales, {x: "month", y: "revenue"}),
    Plot.ruleY([0])
  ]
})
```

The current date is ${new Date().toLocaleDateString()}.
*/

// ============================================================================
// Observable Plot - Basic Charts
// ============================================================================

import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

// Sample data
const sampleData = [
  {name: "A", value: 10, category: "X"},
  {name: "B", value: 20, category: "Y"},
  {name: "C", value: 15, category: "X"},
  {name: "D", value: 25, category: "Y"}
];

// Basic bar chart
export const barChart = (data: Array<{name: string, value: number}>) => {
  return Plot.plot({
    marks: [
      Plot.barY(data, {x: "name", y: "value"}),
      Plot.ruleY([0])
    ]
  });
};

// Basic line chart  
export const lineChart = (data: Array<{date: Date, value: number}>) => {
  return Plot.plot({
    marks: [
      Plot.lineY(data, {x: "date", y: "value"}),
      Plot.ruleY([0])
    ]
  });
};

// Basic scatter plot
export const scatterPlot = (data: Array<{x: number, y: number, category?: string}>) => {
  return Plot.plot({
    marks: [
      Plot.dot(data, {
        x: "x", 
        y: "y", 
        fill: "category",
        tip: true
      })
    ]
  });
};

// Basic area chart
export const areaChart = (data: Array<{date: Date, value: number}>) => {
  return Plot.plot({
    marks: [
      Plot.areaY(data, {x: "date", y: "value"}),
      Plot.lineY(data, {x: "date", y: "value"}),
      Plot.ruleY([0])
    ]
  });
};

// ============================================================================
// File Attachments - Data Loading
// ============================================================================

// Load CSV data
export const loadCSVData = () => {
  return FileAttachment("data/sales.csv").csv({typed: true});
};

// Load JSON data
export const loadJSONData = () => {
  return FileAttachment("data/config.json").json();
};

// Load Parquet data
export const loadParquetData = () => {
  return FileAttachment("data/analytics.parquet").parquet();
};

// Load Arrow data
export const loadArrowData = () => {
  return FileAttachment("data/metrics.arrow").arrow();
};

// Load ZIP archive
export const loadZipData = async () => {
  const zip = await FileAttachment("data/reports.zip").zip();
  const report = await zip.file("monthly-report.json").json();
  return report;
};

// ============================================================================
// Interactive Inputs
// ============================================================================

// Range slider
export const createRangeInput = (min: number, max: number, initial: number) => {
  return Inputs.range([min, max], {
    label: "Threshold",
    value: initial,
    step: 1
  });
};

// Select dropdown
export const createSelectInput = (options: string[], initial?: string) => {
  return Inputs.select(options, {
    label: "Category",
    value: initial
  });
};

// Text input
export const createTextInput = (placeholder?: string) => {
  return Inputs.text({
    label: "Search",
    placeholder: placeholder || "Enter search term..."
  });
};

// Date input
export const createDateInput = (initial?: Date) => {
  return Inputs.date({
    label: "Select Date",
    value: initial || new Date()
  });
};

// Checkbox
export const createCheckbox = (label: string, initial = false) => {
  return Inputs.checkbox([label], {
    value: initial ? [label] : []
  });
};

// ============================================================================
// Basic Reactive Programming
// ============================================================================

// Mutable state
export const createMutableCounter = (initial = 0) => {
  const count = Mutable(initial);
  
  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => count.value = initial;
  
  return {count, increment, decrement, reset};
};

// Generator-based reactivity
export const createReactiveInput = (inputElement: HTMLInputElement) => {
  return Generators.input(inputElement);
};

// Time-based reactivity
export const createTimer = (interval = 1000) => {
  return Generators.observe(notify => {
    const timer = setInterval(notify, interval);
    return () => clearInterval(timer);
  });
};

// ============================================================================
// Display Functions
// ============================================================================

// Display value and return it
export const displayValue = <T>(value: T): T => {
  return display(value);
};

// Display HTML
export const displayHTML = (content: string) => {
  return display(html`${content}`);
};

// Display markdown
export const displayMarkdown = (content: string) => {
  return display(md`${content}`);
};

// ============================================================================
// Basic Data Processing
// ============================================================================

// Group data by key
export const groupBy = <T>(data: T[], key: keyof T) => {
  return d3.group(data, d => d[key]);
};

// Sum values by group
export const sumByGroup = <T>(data: T[], groupKey: keyof T, valueKey: keyof T) => {
  return d3.rollup(
    data,
    v => d3.sum(v, d => Number(d[valueKey])),
    d => d[groupKey]
  );
};

// Filter data by predicate
export const filterData = <T>(data: T[], predicate: (d: T) => boolean) => {
  return data.filter(predicate);
};

// Sort data by key
export const sortData = <T>(data: T[], key: keyof T, ascending = true) => {
  return data.slice().sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return ascending ? -1 : 1;
    if (aVal > bVal) return ascending ? 1 : -1;
    return 0;
  });
};