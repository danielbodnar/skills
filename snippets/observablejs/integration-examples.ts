// Observable Framework - Integration Examples

// ============================================================================
// D3.js Integration
// ============================================================================

import * as d3 from "d3";
import * as Plot from "@observablehq/plot";

// D3 data processing with Plot visualization
export const d3DataProcessing = (rawData: any[]) => {
  // Use D3 for complex data transformations
  const processedData = d3.rollup(
    rawData,
    v => ({
      count: v.length,
      sum: d3.sum(v, d => d.value),
      avg: d3.mean(v, d => d.value),
      median: d3.median(v, d => d.value)
    }),
    d => d.category
  );

  // Convert Map to array for Plot
  const plotData = Array.from(processedData, ([category, stats]) => ({
    category,
    ...stats
  }));

  // Visualize with Plot
  return Plot.plot({
    marks: [
      Plot.barY(plotData, {x: "category", y: "avg"}),
      Plot.ruleY([0])
    ]
  });
};

// Custom D3 component with Observable Framework
export const customD3Component = (data: Array<{x: number, y: number}>) => {
  const width = 600;
  const height = 400;
  const margin = {top: 20, right: 30, bottom: 40, left: 40};

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto");

  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.x))
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.y))
    .range([height - margin.bottom, margin.top]);

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));

  // Add data points
  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .attr("r", 3)
    .attr("fill", "steelblue");

  return svg.node();
};

// ============================================================================
// Leaflet Map Integration
// ============================================================================

export const leafletIntegration = {
  // Basic Leaflet map setup
  createMap: (containerId: string) => {
    // Create map container
    const container = html`<div id="${containerId}" style="height: 400px; width: 100%;"></div>`;
    
    // Initialize map when container is attached
    invalidation.then(() => {
      if (window.L && container.parentNode) {
        const map = L.map(containerId).setView([40.7128, -74.0060], 10);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Clean up on invalidation
        invalidation.then(() => map.remove());
        
        return map;
      }
    });

    return container;
  },

  // Map with data points
  dataPointsMap: (points: Array<{lat: number, lng: number, name: string, value: number}>) => {
    const container = html`<div style="height: 500px; width: 100%;"></div>`;
    
    invalidation.then(() => {
      const map = L.map(container).setView([40.7128, -74.0060], 8);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // Add markers for each point
      points.forEach(point => {
        const marker = L.marker([point.lat, point.lng])
          .bindPopup(`<b>${point.name}</b><br>Value: ${point.value}`)
          .addTo(map);
      });

      // Fit map to show all points
      if (points.length > 0) {
        const group = new L.featureGroup(points.map(p => L.marker([p.lat, p.lng])));
        map.fitBounds(group.getBounds().pad(0.1));
      }

      invalidation.then(() => map.remove());
    });

    return container;
  }
};

// ============================================================================
// Deck.gl Integration
// ============================================================================

export const deckglIntegration = {
  // Basic Deck.gl visualization
  createDeckMap: (data: Array<{lat: number, lng: number, value: number}>) => {
    const container = html`<div style="height: 600px; width: 100%; position: relative;"></div>`;

    // Initialize Deck.gl when container is ready
    Promise.resolve().then(async () => {
      const {Deck, ScatterplotLayer, HexagonLayer} = await import("@deck.gl/core");
      
      const deck = new Deck({
        container,
        initialViewState: {
          longitude: -100,
          latitude: 40,
          zoom: 4,
          pitch: 0,
          bearing: 0
        },
        controller: true,
        layers: [
          new ScatterplotLayer({
            id: 'scatterplot-layer',
            data,
            pickable: true,
            opacity: 0.8,
            stroked: true,
            filled: true,
            radiusScale: 6,
            radiusMinPixels: 1,
            radiusMaxPixels: 100,
            lineWidthMinPixels: 1,
            getPosition: d => [d.lng, d.lat],
            getRadius: d => Math.sqrt(d.value),
            getFillColor: d => [255, 140, 0],
            getLineColor: d => [0, 0, 0]
          })
        ]
      });

      // Cleanup
      invalidation.then(() => {
        deck.finalize();
        container.innerHTML = "";
      });
    });

    return container;
  },

  // Hexagon layer for aggregated data
  hexagonLayer: (data: Array<{position: [number, number], value: number}>) => {
    const container = html`<div style="height: 600px; width: 100%;"></div>`;

    Promise.resolve().then(async () => {
      const {Deck, HexagonLayer} = await import("@deck.gl/aggregation-layers");
      
      const deck = new Deck({
        container,
        initialViewState: {
          longitude: -100,
          latitude: 40,
          zoom: 4
        },
        controller: true,
        layers: [
          new HexagonLayer({
            id: 'hexagon-layer',
            data,
            pickable: true,
            extruded: true,
            radius: 20000,
            elevationScale: 4,
            getPosition: d => d.position,
            getElevationWeight: d => d.value,
            getColorWeight: d => d.value
          })
        ]
      });

      invalidation.then(() => deck.finalize());
    });

    return container;
  }
};

// ============================================================================
// Three.js Integration
// ============================================================================

export const threejsIntegration = {
  // Basic 3D scene
  create3DScene: (data: Array<{x: number, y: number, z: number}>) => {
    const container = html`<div style="height: 500px; width: 100%;"></div>`;

    Promise.resolve().then(async () => {
      const THREE = await import("three");
      
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer();
      
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      // Add lighting
      const light = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(light);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // Create geometry for data points
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshBasicMaterial({color: 0x00ff00});

      data.forEach(point => {
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(point.x, point.y, point.z);
        scene.add(cube);
      });

      camera.position.z = 5;

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        scene.rotation.x += 0.01;
        scene.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
      animate();

      // Cleanup
      invalidation.then(() => {
        container.innerHTML = "";
        renderer.dispose();
      });
    });

    return container;
  }
};

// ============================================================================
// Chart.js Integration
// ============================================================================

export const chartjsIntegration = {
  // Chart.js with Observable data
  createChartJS: (data: Array<{label: string, value: number}>) => {
    const canvas = html`<canvas width="400" height="300"></canvas>`;

    Promise.resolve().then(async () => {
      const Chart = await import("chart.js/auto");
      
      new Chart.default(canvas, {
        type: 'bar',
        data: {
          labels: data.map(d => d.label),
          datasets: [{
            label: 'Values',
            data: data.map(d => d.value),
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    });

    return canvas;
  }
};

// ============================================================================
// WebGL and Custom Canvas
// ============================================================================

export const webglIntegration = {
  // Custom WebGL visualization
  webglVisualization: (data: Float32Array) => {
    const canvas = html`<canvas width="600" height="400"></canvas>`;
    const gl = canvas.getContext("webgl");

    if (!gl) {
      return html`<div>WebGL not supported</div>`;
    }

    // Vertex shader source
    const vertexShaderSource = `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;

    // Fragment shader source
    const fragmentShaderSource = `
      precision mediump float;
      uniform vec4 u_color;
      void main() {
        gl_FragColor = u_color;
      }
    `;

    // Shader creation and program setup would go here
    // This is a simplified example

    return canvas;
  }
};

// ============================================================================
// External API Integration
// ============================================================================

export const apiIntegration = {
  // Real-time data from WebSocket
  websocketData: (url: string) => {
    const data = Mutable([]);
    
    const ws = new WebSocket(url);
    
    ws.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        data.value = [...data.value, newData].slice(-100); // Keep last 100 items
      } catch (e) {
        console.error("Failed to parse WebSocket data:", e);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Cleanup on invalidation
    invalidation.then(() => {
      ws.close();
    });

    return data;
  },

  // Polling API data
  pollingData: (url: string, intervalMs = 5000) => {
    const data = Mutable(null);
    
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const result = await response.json();
        data.value = result;
      } catch (e) {
        console.error("Failed to fetch data:", e);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling
    const interval = setInterval(fetchData, intervalMs);

    // Cleanup
    invalidation.then(() => {
      clearInterval(interval);
    });

    return data;
  }
};

// ============================================================================
// Database Integration
// ============================================================================

export const databaseIntegration = {
  // SQLite in the browser
  sqliteInBrowser: async () => {
    // This would require a SQLite WASM library like sql.js
    const SQL = await import("sql.js");
    await SQL.default();
    
    const db = new SQL.Database();
    
    // Create and populate table
    db.run(`
      CREATE TABLE sales (
        id INTEGER PRIMARY KEY,
        date TEXT,
        amount REAL,
        product TEXT
      )
    `);

    db.run(`
      INSERT INTO sales (date, amount, product) VALUES
      ('2024-01-01', 100.50, 'Widget A'),
      ('2024-01-02', 75.25, 'Widget B'),
      ('2024-01-03', 200.00, 'Widget A')
    `);

    // Query data
    const results = db.exec("SELECT * FROM sales ORDER BY date");
    
    return results[0]?.values || [];
  },

  // DuckDB integration
  duckdbQuery: async (query: string) => {
    // This would use DuckDB WASM
    const duckdb = await import("@duckdb/duckdb-wasm");
    
    const bundle = await duckdb.selectBundle({
      mvp: {
        mainModule: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@latest/dist/duckdb-mvp.wasm",
        mainWorker: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@latest/dist/duckdb-browser-mvp.worker.js"
      }
    });

    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.VoidLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    
    await db.instantiate(bundle.mainModule);
    const conn = await db.connect();
    
    const result = await conn.query(query);
    await conn.close();
    await db.terminate();
    
    return result.toArray();
  }
};

// ============================================================================
// Machine Learning Integration
// ============================================================================

export const mlIntegration = {
  // TensorFlow.js integration
  tensorflowPrediction: async (inputData: number[][]) => {
    const tf = await import("@tensorflow/tfjs");
    
    // Create a simple model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({inputShape: [inputData[0].length], units: 10, activation: 'relu'}),
        tf.layers.dense({units: 1, activation: 'linear'})
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    // Convert input to tensor
    const xs = tf.tensor2d(inputData);
    
    // Make predictions (this is just an example)
    const predictions = model.predict(xs) as tf.Tensor;
    const results = await predictions.data();
    
    // Cleanup tensors
    xs.dispose();
    predictions.dispose();
    
    return Array.from(results);
  },

  // Observable + ML.js
  observableMLJS: async (data: number[][]) => {
    const ML = await import("ml-js");
    
    // Example: K-means clustering
    const kmeans = new ML.KMeans(data, 3);
    const clusters = kmeans.clusters;
    
    // Visualize clusters with Plot
    const clusterData = data.map((point, i) => ({
      x: point[0],
      y: point[1],
      cluster: clusters[i]
    }));

    return Plot.plot({
      marks: [
        Plot.dot(clusterData, {
          x: "x",
          y: "y", 
          fill: "cluster",
          tip: true
        })
      ]
    });
  }
};

// ============================================================================
// Audio/Media Integration
// ============================================================================

export const mediaIntegration = {
  // Audio visualization
  audioVisualization: (audioElement: HTMLAudioElement) => {
    const canvas = html`<canvas width="800" height="200"></canvas>`;
    const ctx = canvas.getContext("2d");
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioElement);
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };

    draw();
    
    invalidation.then(() => {
      audioContext.close();
    });

    return canvas;
  },

  // Video frame analysis
  videoFrameAnalysis: (videoElement: HTMLVideoElement) => {
    const canvas = html`<canvas></canvas>`;
    const ctx = canvas.getContext("2d");
    
    const analyzeFrame = () => {
      if (videoElement.paused || videoElement.ended) return;
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      ctx.drawImage(videoElement, 0, 0);
      
      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple color analysis
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      
      const pixelCount = data.length / 4;
      const avgColor = {
        r: Math.round(r / pixelCount),
        g: Math.round(g / pixelCount), 
        b: Math.round(b / pixelCount)
      };
      
      // Display average color
      canvas.style.borderColor = `rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`;
      canvas.style.borderWidth = "5px";
      canvas.style.borderStyle = "solid";
      
      requestAnimationFrame(analyzeFrame);
    };

    videoElement.addEventListener('play', analyzeFrame);
    
    return canvas;
  }
};