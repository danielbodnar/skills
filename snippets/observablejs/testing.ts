// Observable Framework - Testing Examples

// ============================================================================
// Unit Testing Framework Components
// ============================================================================

// Test utilities for Observable Framework
export const testUtils = {
  // Mock FileAttachment for testing
  mockFileAttachment: (data: any, type: 'csv' | 'json' | 'text' | 'parquet' | 'arrow' = 'json') => {
    const mockAttachment = {
      name: 'test-data',
      
      async csv(options?: any) {
        if (typeof data === 'string') {
          const {csvParse} = await import('d3-dsv');
          return csvParse(data);
        }
        return data;
      },
      
      async json() {
        return typeof data === 'string' ? JSON.parse(data) : data;
      },
      
      async text() {
        return typeof data === 'string' ? data : JSON.stringify(data);
      },
      
      async arrayBuffer() {
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        return new TextEncoder().encode(text).buffer;
      },
      
      async parquet() {
        // Mock parquet data - would need actual implementation
        return data;
      },
      
      async arrow() {
        // Mock arrow data - would need actual implementation  
        return data;
      },
      
      async image() {
        // Mock image - return a test image element
        const img = document.createElement('img');
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+';
        return img;
      },
      
      async zip() {
        return {
          file: (name: string) => ({
            async json() { return data; },
            async text() { return JSON.stringify(data); }
          })
        };
      }
    };
    
    return mockAttachment;
  },

  // Mock Inputs for testing
  mockInputs: {
    range: (domain: [number, number], options: any = {}) => {
      const input = document.createElement('input');
      input.type = 'range';
      input.min = domain[0].toString();
      input.max = domain[1].toString();
      input.value = (options.value || domain[0]).toString();
      
      Object.defineProperty(input, 'value', {
        get: () => parseFloat(input.getAttribute('value') || domain[0].toString()),
        set: (val) => input.setAttribute('value', val.toString())
      });
      
      return input;
    },
    
    select: (options: any[], config: any = {}) => {
      const select = document.createElement('select');
      select.multiple = config.multiple || false;
      
      options.forEach((option, i) => {
        const optionEl = document.createElement('option');
        optionEl.value = i.toString();
        optionEl.textContent = config.format ? config.format(option) : option.toString();
        if (i === 0 && !config.multiple) optionEl.selected = true;
        select.appendChild(optionEl);
      });
      
      return select;
    },
    
    text: (options: any = {}) => {
      const input = document.createElement('input');
      input.type = options.type || 'text';
      input.value = options.value || '';
      input.placeholder = options.placeholder || '';
      return input;
    }
  },

  // Create test DOM environment
  createTestDOM: () => {
    // Create a test container
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    
    // Mock window globals for Observable
    global.width = 640;
    global.invalidation = Promise.resolve();
    global.now = Date.now();
    
    return {
      container,
      cleanup: () => {
        document.body.removeChild(container);
      }
    };
  }
};

// ============================================================================
// Plot Testing Utilities
// ============================================================================

export const plotTestUtils = {
  // Test Plot chart generation
  testPlotChart: (plotFunction: () => any, expectedMarks: number) => {
    const chart = plotFunction();
    
    // Check if chart is an SVG element
    expect(chart.tagName).toBe('SVG');
    
    // Check number of marks (rough validation)
    const marks = chart.querySelectorAll('g[aria-label]');
    expect(marks.length).toBeGreaterThanOrEqual(expectedMarks);
    
    return chart;
  },

  // Extract data from Plot chart
  extractPlotData: (chart: SVGElement) => {
    const data = [];
    const marks = chart.querySelectorAll('[data-value]');
    
    marks.forEach(mark => {
      const value = mark.getAttribute('data-value');
      if (value) {
        data.push(JSON.parse(value));
      }
    });
    
    return data;
  },

  // Test Plot scales
  testPlotScales: (plotConfig: any) => {
    const expectedScales = ['x', 'y', 'color', 'r'];
    const configuredScales = Object.keys(plotConfig).filter(key => 
      expectedScales.includes(key)
    );
    
    return {
      hasXScale: configuredScales.includes('x'),
      hasYScale: configuredScales.includes('y'),
      hasColorScale: configuredScales.includes('color'),
      hasRadiusScale: configuredScales.includes('r'),
      scaleCount: configuredScales.length
    };
  }
};

// ============================================================================
// Data Loader Testing
// ============================================================================

export const dataLoaderTests = {
  // Test CSV data loader
  testCSVLoader: async (loaderFunction: () => Promise<string>, expectedRows: number) => {
    const csvOutput = await loaderFunction();
    
    // Parse CSV to validate structure
    const {csvParse} = await import('d3-dsv');
    const data = csvParse(csvOutput);
    
    expect(data.length).toBe(expectedRows);
    expect(data[0]).toBeTruthy();
    expect(typeof data[0]).toBe('object');
    
    return data;
  },

  // Test JSON data loader
  testJSONLoader: async (loaderFunction: () => Promise<string>) => {
    const jsonOutput = await loaderFunction();
    
    // Validate JSON structure
    let data;
    expect(() => {
      data = JSON.parse(jsonOutput);
    }).not.toThrow();
    
    expect(data).toBeTruthy();
    
    return data;
  },

  // Test data loader error handling
  testLoaderErrorHandling: async (loaderFunction: () => Promise<string>) => {
    // Mock network failure
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    try {
      const result = await loaderFunction();
      
      // Should return fallback data or error structure
      expect(result).toBeTruthy();
      
      // If it's JSON, should have error information
      try {
        const parsed = JSON.parse(result);
        expect(parsed.error || parsed.data).toBeTruthy();
      } catch {
        // If not JSON, should be a non-empty string
        expect(result.length).toBeGreaterThan(0);
      }
    } finally {
      global.fetch = originalFetch;
    }
  },

  // Mock database connection for testing
  mockDatabase: (mockData: any[]) => {
    return {
      query: jest.fn().mockResolvedValue({rows: mockData}),
      connect: jest.fn().mockResolvedValue(undefined),
      end: jest.fn().mockResolvedValue(undefined)
    };
  }
};

// ============================================================================
// Integration Testing
// ============================================================================

export const integrationTests = {
  // Test complete page rendering
  testPageRender: async (pageContent: string, expectedElements: string[]) => {
    const {createTestDOM} = testUtils;
    const {container, cleanup} = createTestDOM();
    
    try {
      // Parse and render markdown content (simplified)
      // In real testing, you'd use the actual Observable Framework parser
      container.innerHTML = pageContent.replace(/```js\n(.*?)\n```/gs, (match, code) => {
        try {
          // Execute JavaScript code blocks (be careful in real implementation)
          const result = eval(code);
          return `<div class="js-result">${result}</div>`;
        } catch (e) {
          return `<div class="js-error">${e.message}</div>`;
        }
      });
      
      // Check for expected elements
      expectedElements.forEach(selector => {
        const element = container.querySelector(selector);
        expect(element).toBeTruthy();
      });
      
      return container;
    } finally {
      cleanup();
    }
  },

  // Test data flow from loader to visualization
  testDataFlow: async (
    loaderFunction: () => Promise<any>,
    visualizationFunction: (data: any) => any,
    expectedVisualizationType: string
  ) => {
    // Load data
    const data = await loaderFunction();
    expect(data).toBeTruthy();
    
    // Create visualization
    const viz = visualizationFunction(data);
    expect(viz.tagName).toBe(expectedVisualizationType);
    
    return {data, visualization: viz};
  }
};

// ============================================================================
// Performance Testing
// ============================================================================

export const performanceTests = {
  // Measure rendering performance
  measureRenderTime: async (renderFunction: () => any) => {
    const start = performance.now();
    const result = await renderFunction();
    const end = performance.now();
    
    return {
      result,
      renderTime: end - start,
      isPerformant: (end - start) < 100 // Less than 100ms
    };
  },

  // Test memory usage
  testMemoryUsage: async (testFunction: () => Promise<void>) => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    await testFunction();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryDelta = finalMemory - initialMemory;
    
    return {
      initialMemory,
      finalMemory,
      memoryDelta,
      hasMemoryLeak: memoryDelta > 10 * 1024 * 1024 // 10MB threshold
    };
  }
};

// ============================================================================
// Accessibility Testing
// ============================================================================

export const accessibilityTests = {
  // Test chart accessibility
  testChartAccessibility: (chart: SVGElement) => {
    const checks = {
      hasTitle: !!chart.querySelector('title'),
      hasAriaLabel: !!chart.getAttribute('aria-label'),
      hasDescription: !!chart.querySelector('desc'),
      hasRole: chart.getAttribute('role') === 'img',
      hasTabIndex: chart.hasAttribute('tabindex')
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    return {
      ...checks,
      accessibilityScore: score / Object.keys(checks).length,
      isAccessible: score >= 3
    };
  },

  // Test color contrast
  testColorContrast: (element: HTMLElement) => {
    const style = getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;
    
    // Simple contrast calculation (real implementation would be more complex)
    const bgLuminance = calculateLuminance(backgroundColor);
    const fgLuminance = calculateLuminance(color);
    
    const contrastRatio = (Math.max(bgLuminance, fgLuminance) + 0.05) / 
                         (Math.min(bgLuminance, fgLuminance) + 0.05);
    
    return {
      contrastRatio,
      meetsWCAA: contrastRatio >= 4.5,
      meetsWCAAEnhanced: contrastRatio >= 7
    };
  }
};

// Helper function for luminance calculation
function calculateLuminance(color: string): number {
  // Simplified luminance calculation
  // Real implementation would parse RGB values properly
  if (color.includes('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const [r, g, b] = matches.map(n => parseInt(n) / 255);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
  }
  return 0.5; // Default middle luminance
}

// ============================================================================
// Snapshot Testing
// ============================================================================

export const snapshotTests = {
  // Create serializable snapshot of chart
  createChartSnapshot: (chart: SVGElement) => {
    return {
      tagName: chart.tagName,
      width: chart.getAttribute('width'),
      height: chart.getAttribute('height'),
      viewBox: chart.getAttribute('viewBox'),
      childCount: chart.children.length,
      marks: Array.from(chart.querySelectorAll('g[aria-label]')).map(mark => ({
        ariaLabel: mark.getAttribute('aria-label'),
        childCount: mark.children.length
      }))
    };
  },

  // Compare snapshots
  compareSnapshots: (snapshot1: any, snapshot2: any) => {
    const differences = [];
    
    Object.keys(snapshot1).forEach(key => {
      if (JSON.stringify(snapshot1[key]) !== JSON.stringify(snapshot2[key])) {
        differences.push({
          key,
          expected: snapshot1[key],
          actual: snapshot2[key]
        });
      }
    });
    
    return {
      isEqual: differences.length === 0,
      differences
    };
  }
};

// ============================================================================
// Example Test Suite
// ============================================================================

export const exampleTests = {
  // Test a complete Observable Framework page
  testDashboardPage: async () => {
    const mockSalesData = [
      {date: '2024-01', revenue: 1000, region: 'North'},
      {date: '2024-02', revenue: 1200, region: 'North'},
      {date: '2024-01', revenue: 800, region: 'South'},
      {date: '2024-02', revenue: 900, region: 'South'}
    ];

    // Mock FileAttachment
    global.FileAttachment = jest.fn().mockReturnValue(
      testUtils.mockFileAttachment(mockSalesData, 'csv')
    );

    // Test data loading
    const attachment = FileAttachment('data/sales.csv');
    const data = await attachment.csv({typed: true});
    expect(data).toHaveLength(4);
    expect(data[0].revenue).toBe(1000);

    // Test visualization creation
    const chart = Plot.plot({
      marks: [
        Plot.barY(data, {x: 'region', y: 'revenue'}),
        Plot.ruleY([0])
      ]
    });

    expect(chart.tagName).toBe('SVG');
    
    // Test accessibility
    const a11yResults = accessibilityTests.testChartAccessibility(chart);
    expect(a11yResults.accessibilityScore).toBeGreaterThan(0.5);

    return {data, chart, a11yResults};
  },

  // Test interactive components
  testInteractiveComponents: () => {
    const {createTestDOM} = testUtils;
    const {container, cleanup} = createTestDOM();

    try {
      // Create range input
      const rangeInput = testUtils.mockInputs.range([0, 100], {value: 50});
      container.appendChild(rangeInput);

      // Test initial value
      expect(rangeInput.value).toBe(50);

      // Test value change
      rangeInput.value = 75;
      expect(rangeInput.value).toBe(75);

      // Create select input
      const selectInput = testUtils.mockInputs.select(['A', 'B', 'C']);
      container.appendChild(selectInput);

      expect(selectInput.options.length).toBe(3);
      expect(selectInput.selectedIndex).toBe(0);

      return {rangeInput, selectInput};
    } finally {
      cleanup();
    }
  }
};

// ============================================================================
// Test Configuration and Setup
// ============================================================================

export const testConfig = {
  // Jest configuration for Observable Framework
  jestConfig: {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    moduleNameMapping: {
      '^@observablehq/plot$': '<rootDir>/node_modules/@observablehq/plot',
      '^d3$': '<rootDir>/node_modules/d3'
    },
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
    },
    testMatch: [
      '<rootDir>/test/**/*.test.(js|jsx|ts|tsx)',
      '<rootDir>/src/**/*.test.(js|jsx|ts|tsx)'
    ],
    collectCoverageFrom: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
      '!src/data/**/*'
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    }
  },

  // Test setup utilities
  setupTests: () => {
    // Mock Observable Framework globals
    global.html = (strings: TemplateStringsArray, ...values: any[]) => {
      const div = document.createElement('div');
      div.innerHTML = strings[0]; // Simplified implementation
      return div.firstChild as HTMLElement;
    };

    global.Plot = {
      plot: jest.fn().mockImplementation((config) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '640');
        svg.setAttribute('height', '400');
        return svg;
      }),
      barY: jest.fn(),
      lineY: jest.fn(),
      dot: jest.fn(),
      ruleY: jest.fn()
    };

    global.d3 = {
      csvParse: jest.fn(),
      json: jest.fn(),
      extent: jest.fn().mockReturnValue([0, 100]),
      max: jest.fn().mockReturnValue(100),
      rollup: jest.fn()
    };

    // Mock resize observer
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
  }
};