// Observable Plot - Comprehensive Chart Examples

import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

// ============================================================================
// Sample Data Types
// ============================================================================

type TimeSeriesData = {
  date: Date;
  value: number;
  category?: string;
};

type CategoricalData = {
  category: string;
  value: number;
  subcategory?: string;
};

type ScatterData = {
  x: number;
  y: number;
  size?: number;
  color?: string;
  label?: string;
};

type GeographicData = {
  lat: number;
  lng: number;
  value: number;
  region: string;
};

// ============================================================================
// Basic Chart Types
// ============================================================================

// Line chart with multiple series
export const multiSeriesLineChart = (data: TimeSeriesData[]) => {
  return Plot.plot({
    width: 800,
    height: 400,
    marginLeft: 60,
    x: {
      type: "utc",
      label: "Date"
    },
    y: {
      grid: true,
      label: "Value"
    },
    color: {
      legend: true
    },
    marks: [
      Plot.ruleY([0]),
      Plot.lineY(data, {
        x: "date",
        y: "value", 
        stroke: "category",
        z: "category",
        strokeWidth: 2
      }),
      Plot.tip(data, Plot.pointerX({
        x: "date",
        y: "value",
        stroke: "category"
      }))
    ]
  });
};

// Grouped bar chart
export const groupedBarChart = (data: CategoricalData[]) => {
  return Plot.plot({
    width: 600,
    height: 400,
    marginLeft: 80,
    x: {
      label: "Value"
    },
    y: {
      label: "Category"
    },
    color: {
      legend: true
    },
    marks: [
      Plot.barX(data, {
        x: "value",
        y: "category",
        fill: "subcategory",
        tip: true
      }),
      Plot.ruleX([0])
    ]
  });
};

// Stacked area chart
export const stackedAreaChart = (data: TimeSeriesData[]) => {
  return Plot.plot({
    width: 800,
    height: 400,
    x: {
      type: "utc",
      label: "Date"
    },
    y: {
      grid: true,
      label: "Value"
    },
    color: {
      legend: true
    },
    marks: [
      Plot.areaY(data, {
        x: "date",
        y: "value",
        fill: "category",
        tip: true
      }),
      Plot.ruleY([0])
    ]
  });
};

// Scatter plot with size encoding
export const scatterPlotWithSize = (data: ScatterData[]) => {
  return Plot.plot({
    width: 600,
    height: 600,
    grid: true,
    x: {
      label: "X Axis"
    },
    y: {
      label: "Y Axis"
    },
    r: {
      label: "Size",
      legend: true
    },
    color: {
      legend: true
    },
    marks: [
      Plot.dot(data, {
        x: "x",
        y: "y",
        r: "size",
        fill: "color",
        fillOpacity: 0.7,
        stroke: "white",
        strokeWidth: 1,
        tip: true
      })
    ]
  });
};

// ============================================================================
// Advanced Chart Types
// ============================================================================

// Horizon chart
export const horizonChart = (data: TimeSeriesData[]) => {
  const bands = 5;
  const step = d3.max(data, d => d.value) / bands;
  
  return Plot.plot({
    width: 800,
    height: 300,
    x: {
      type: "utc",
      label: "Date"
    },
    y: {
      domain: [0, step]
    },
    color: {
      scheme: "blues"
    },
    marks: [
      ...d3.range(bands).map(i => 
        Plot.areaY(data, {
          x: "date",
          y: d => Math.max(0, d.value - i * step),
          fill: i,
          clip: true
        })
      )
    ]
  });
};

// Heatmap
export const heatmap = (data: Array<{x: string, y: string, value: number}>) => {
  return Plot.plot({
    width: 600,
    height: 400,
    padding: 0,
    x: {
      label: "X Category"
    },
    y: {
      label: "Y Category"
    },
    color: {
      scheme: "blues",
      legend: true,
      label: "Value"
    },
    marks: [
      Plot.cell(data, {
        x: "x",
        y: "y", 
        fill: "value",
        inset: 0.5,
        tip: true
      }),
      Plot.text(data, {
        x: "x",
        y: "y",
        text: d => d.value.toFixed(1),
        fill: "white",
        fontSize: 12
      })
    ]
  });
};

// Violin plot
export const violinPlot = (data: Array<{category: string, value: number}>) => {
  return Plot.plot({
    width: 600,
    height: 400,
    x: {
      label: "Category"
    },
    y: {
      grid: true,
      label: "Value"
    },
    marks: [
      // Violin (density estimation)
      Plot.areaX(data, Plot.groupY(
        {x: "count"},
        {
          y: Plot.bin({thresholds: 20}),
          fx: "category",
          curve: "basis",
          fillOpacity: 0.3
        }
      )),
      // Box plot overlay
      Plot.boxY(data, {
        x: "category", 
        y: "value",
        stroke: "black"
      })
    ]
  });
};

// ============================================================================
// Interactive Charts
// ============================================================================

// Brushable time series
export const brushableTimeSeries = (data: TimeSeriesData[]) => {
  return Plot.plot({
    width: 800,
    height: 400,
    x: {
      type: "utc",
      label: "Date"
    },
    y: {
      grid: true,
      label: "Value"
    },
    marks: [
      Plot.lineY(data, {
        x: "date",
        y: "value",
        stroke: "steelblue",
        strokeWidth: 2
      }),
      Plot.crosshair(data, {
        x: "date",
        y: "value"
      })
    ]
  });
};

// Zoomable scatter plot
export const zoomableScatterPlot = (data: ScatterData[]) => {
  return Plot.plot({
    width: 600,
    height: 600,
    grid: true,
    x: {
      label: "X Axis",
      nice: true
    },
    y: {
      label: "Y Axis", 
      nice: true
    },
    marks: [
      Plot.dot(data, {
        x: "x",
        y: "y",
        fill: "color",
        r: 4,
        tip: true
      }),
      Plot.frame()
    ]
  });
};

// ============================================================================
// Statistical Charts
// ============================================================================

// Box plot with jitter
export const boxPlotWithJitter = (data: Array<{category: string, value: number}>) => {
  return Plot.plot({
    width: 600,
    height: 400,
    x: {
      label: "Category"
    },
    y: {
      grid: true,
      label: "Value"
    },
    marks: [
      // Jittered points
      Plot.dot(data, {
        x: "category",
        y: "value",
        x: d => d.category + (Math.random() - 0.5) * 0.4,
        r: 2,
        fillOpacity: 0.5,
        fill: "steelblue"
      }),
      // Box plot
      Plot.boxY(data, {
        x: "category",
        y: "value",
        stroke: "black",
        strokeWidth: 2
      })
    ]
  });
};

// Regression line
export const scatterWithRegression = (data: ScatterData[]) => {
  // Calculate regression line
  const regression = d3.leastSquares(
    data.map(d => [d.x, d.y])
  );
  
  const xExtent = d3.extent(data, d => d.x);
  const regressionLine = [
    {x: xExtent[0], y: regression(xExtent[0])},
    {x: xExtent[1], y: regression(xExtent[1])}
  ];
  
  return Plot.plot({
    width: 600,
    height: 600,
    grid: true,
    marks: [
      Plot.dot(data, {
        x: "x",
        y: "y",
        fill: "steelblue",
        fillOpacity: 0.6,
        tip: true
      }),
      Plot.line(regressionLine, {
        x: "x",
        y: "y",
        stroke: "red",
        strokeWidth: 2,
        strokeDasharray: "5,5"
      })
    ]
  });
};

// ============================================================================
// Faceted Charts
// ============================================================================

// Small multiples
export const smallMultiples = (data: TimeSeriesData[]) => {
  return Plot.plot({
    width: 800,
    height: 600,
    facet: {
      data: data,
      y: "category",
      marginRight: 80
    },
    fy: {
      label: null
    },
    x: {
      type: "utc",
      label: "Date"
    },
    y: {
      label: "Value"
    },
    marks: [
      Plot.areaY(data, {
        x: "date",
        y: "value",
        fill: "lightblue",
        fillOpacity: 0.6
      }),
      Plot.lineY(data, {
        x: "date", 
        y: "value",
        stroke: "steelblue",
        strokeWidth: 2
      }),
      Plot.text(data, Plot.selectFirst({
        text: "category",
        frameAnchor: "top-left",
        dx: 6,
        dy: 6,
        fontSize: 12,
        fontWeight: "bold"
      })),
      Plot.frame()
    ]
  });
};

// ============================================================================
// Geographic Visualizations
// ============================================================================

// Choropleth map (requires topojson data)
export const choroplethMap = (
  geoData: any, 
  data: Array<{id: string, value: number}>
) => {
  return Plot.plot({
    width: 800,
    height: 500,
    projection: "albers-usa",
    color: {
      scheme: "blues",
      legend: true,
      label: "Value"
    },
    marks: [
      Plot.geo(geoData, {
        fill: d => {
          const match = data.find(item => item.id === d.id);
          return match ? match.value : 0;
        },
        stroke: "white",
        strokeWidth: 0.5,
        tip: true
      })
    ]
  });
};

// Point map
export const pointMap = (data: GeographicData[]) => {
  return Plot.plot({
    width: 800,
    height: 500,
    projection: "natural-earth",
    r: {
      range: [2, 20],
      label: "Value"
    },
    color: {
      legend: true
    },
    marks: [
      Plot.sphere({stroke: "black", strokeWidth: 1}),
      Plot.graticule({stroke: "lightgray", strokeOpacity: 0.3}),
      Plot.dot(data, {
        x: "lng",
        y: "lat", 
        r: "value",
        fill: "region",
        fillOpacity: 0.7,
        stroke: "white",
        strokeWidth: 1,
        tip: true
      })
    ]
  });
};

// ============================================================================
// Animation and Transitions
// ============================================================================

// Animated bar chart race
export const animatedBarRace = (
  data: Array<{date: Date, category: string, value: number}>,
  currentDate: Date
) => {
  const currentData = data
    .filter(d => d.date <= currentDate)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
    
  return Plot.plot({
    width: 600,
    height: 400,
    marginLeft: 120,
    x: {
      label: "Value",
      domain: [0, d3.max(data, d => d.value)]
    },
    y: {
      label: null,
      domain: currentData.map(d => d.category)
    },
    color: {
      legend: true
    },
    marks: [
      Plot.barX(currentData, {
        x: "value",
        y: "category",
        fill: "category",
        tip: true
      }),
      Plot.text(currentData, {
        x: "value",
        y: "category", 
        text: d => d.value.toLocaleString(),
        textAnchor: "start",
        dx: 6,
        fill: "black"
      }),
      Plot.ruleX([0])
    ]
  });
};

// ============================================================================
// Custom Mark Compositions
// ============================================================================

// Candlestick chart
export const candlestickChart = (
  data: Array<{
    date: Date, 
    open: number, 
    high: number, 
    low: number, 
    close: number
  }>
) => {
  return Plot.plot({
    width: 800,
    height: 400,
    x: {
      type: "utc",
      label: "Date"
    },
    y: {
      grid: true,
      label: "Price"
    },
    marks: [
      // High-low lines
      Plot.ruleY(data, {
        x: "date",
        y1: "low",
        y2: "high",
        stroke: "black"
      }),
      // Open-close rectangles
      Plot.rectY(data, {
        x: "date",
        y1: "open",
        y2: "close",
        fill: d => d.close > d.open ? "green" : "red",
        stroke: "black",
        width: 6
      })
    ]
  });
};

// Streamgraph
export const streamgraph = (data: TimeSeriesData[]) => {
  return Plot.plot({
    width: 800,
    height: 400,
    x: {
      type: "utc",
      label: "Date"
    },
    y: {
      label: "Value"
    },
    color: {
      legend: true
    },
    marks: [
      Plot.areaY(data, {
        x: "date",
        y: "value",
        fill: "category",
        offset: "wiggle"
      })
    ]
  });
};

// ============================================================================
// Export All Chart Functions
// ============================================================================

export const plotExamples = {
  multiSeriesLineChart,
  groupedBarChart,
  stackedAreaChart,
  scatterPlotWithSize,
  horizonChart,
  heatmap,
  violinPlot,
  brushableTimeSeries,
  zoomableScatterPlot,
  boxPlotWithJitter,
  scatterWithRegression,
  smallMultiples,
  choroplethMap,
  pointMap,
  animatedBarRace,
  candlestickChart,
  streamgraph
};