// Model Management and Configuration for WebExtensions AI

// 1. Model Hub Configuration
const ModelConfigs = {
  HUGGINGFACE: {
    hub: "huggingface",
    tasks: {
      summarization: {
        defaultModel: "facebook/bart-large-cnn",
        alternatives: ["t5-small", "google/pegasus-xsum"]
      },
      classification: {
        defaultModel: "cardiffnlp/twitter-roberta-base-sentiment-latest",
        alternatives: ["distilbert-base-uncased-finetuned-sst-2-english"]
      },
      translation: {
        defaultModel: "Helsinki-NLP/opus-mt-en-fr",
        alternatives: ["Helsinki-NLP/opus-mt-en-de", "Helsinki-NLP/opus-mt-en-es"]
      },
      generation: {
        defaultModel: "gpt2",
        alternatives: ["microsoft/DialoGPT-medium", "distilgpt2"]
      },
      questionAnswering: {
        defaultModel: "distilbert-base-cased-distilled-squad",
        alternatives: ["bert-large-uncased-whole-word-masking-finetuned-squad"]
      }
    }
  },
  MOZILLA: {
    hub: "mozilla",
    tasks: {
      tabGrouping: {
        defaultModel: "smart-tab-topic",
        description: "Generates concise labels for tab groups"
      }
    }
  }
};

// 2. Advanced Engine Creation with Model Selection
async function createEngineWithModel(taskName, options = {}) {
  const {
    modelHub = "huggingface",
    modelId = null,
    modelRevision = null,
    tokenizerId = null,
    device = null,
    quantization = null
  } = options;

  const config = {
    modelHub: modelHub,
    taskName: taskName
  };

  // Add optional parameters
  if (modelId) config.modelId = modelId;
  if (modelRevision) config.modelRevision = modelRevision;
  if (tokenizerId) config.tokenizerId = tokenizerId;
  if (device) config.device = device;
  if (quantization) config.quantization = quantization;

  try {
    const engine = await browser.trial.ml.createEngine(config);
    console.log(`Created ${taskName} engine with model: ${modelId || 'default'}`);
    return engine;
  } catch (error) {
    console.error(`Failed to create engine for ${taskName}:`, error);
    throw error;
  }
}

// 3. Model Cache Management
class ModelManager {
  constructor() {
    this.cachedModels = new Map();
    this.modelUsage = new Map();
  }

  // Get model info
  getModelInfo(taskName, modelHub = "huggingface") {
    const hubConfig = ModelConfigs[modelHub.toUpperCase()];
    if (!hubConfig || !hubConfig.tasks[taskName]) {
      throw new Error(`Task ${taskName} not supported for ${modelHub}`);
    }
    return hubConfig.tasks[taskName];
  }

  // Create engine with fallback models
  async createEngineWithFallback(taskName, modelHub = "huggingface") {
    const modelInfo = this.getModelInfo(taskName, modelHub);
    const modelsToTry = [modelInfo.defaultModel, ...modelInfo.alternatives];

    for (const modelId of modelsToTry) {
      try {
        console.log(`Trying model: ${modelId}`);
        const engine = await createEngineWithModel(taskName, {
          modelHub,
          modelId
        });
        
        // Track successful model usage
        this.modelUsage.set(modelId, (this.modelUsage.get(modelId) || 0) + 1);
        return engine;
      } catch (error) {
        console.warn(`Model ${modelId} failed, trying next:`, error.message);
      }
    }

    throw new Error(`All models failed for task: ${taskName}`);
  }

  // Delete cached models
  async clearModelCache() {
    try {
      await browser.trial.ml.deleteCachedModels();
      this.cachedModels.clear();
      console.log("Model cache cleared successfully");
    } catch (error) {
      console.error("Failed to clear model cache:", error);
      throw error;
    }
  }

  // Get model usage statistics
  getUsageStats() {
    return Array.from(this.modelUsage.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count);
  }
}

// 4. Device and Performance Optimization
async function createOptimizedEngine(taskName, options = {}) {
  const {
    preferGPU = true,
    quantization = "int8",
    modelHub = "huggingface"
  } = options;

  // Determine best device
  const device = preferGPU ? "gpu" : "wasm";

  try {
    // Try with GPU first if preferred
    if (preferGPU) {
      try {
        return await createEngineWithModel(taskName, {
          modelHub,
          device: "gpu",
          quantization
        });
      } catch (error) {
        console.warn("GPU failed, falling back to WASM:", error.message);
      }
    }

    // Fallback to WASM
    return await createEngineWithModel(taskName, {
      modelHub,
      device: "wasm",
      quantization
    });
  } catch (error) {
    console.error("Both GPU and WASM failed:", error);
    throw error;
  }
}

// 5. Tab Grouping with Mozilla Models
async function createTabGroupingEngine() {
  try {
    const engine = await browser.trial.ml.createEngine({
      modelHub: "mozilla",
      taskName: "summarization", // Using Mozilla's smart-tab-topic model
      modelId: "smart-tab-topic"
    });

    return engine;
  } catch (error) {
    console.error("Failed to create tab grouping engine:", error);
    throw error;
  }
}

// 6. Generate Tab Group Labels
async function generateTabGroupLabel(tabTitles) {
  try {
    const engine = await createTabGroupingEngine();
    
    // Format input for tab grouping model
    const input = tabTitles.length === 1 
      ? `Topic from keywords: . titles \n${tabTitles[0]}`
      : `Topic from keywords: ${tabTitles.join(',')}. titles: \n${tabTitles.join('\n')}`;

    const result = await browser.trial.ml.runEngine({
      args: [input]
    });

    return result[0]?.generated_text || "Untitled Group";
  } catch (error) {
    console.error("Failed to generate tab group label:", error);
    return "Untitled Group";
  }
}

// 7. Model Configuration Examples
const ExampleConfigs = {
  // High accuracy summarization
  accurateSummarization: {
    modelHub: "huggingface",
    taskName: "summarization",
    modelId: "facebook/bart-large-cnn",
    device: "gpu",
    quantization: "fp16"
  },

  // Fast summarization
  fastSummarization: {
    modelHub: "huggingface",
    taskName: "summarization",
    modelId: "t5-small",
    device: "wasm",
    quantization: "int8"
  },

  // Multilingual translation
  translation: {
    modelHub: "huggingface",
    taskName: "translation",
    modelId: "Helsinki-NLP/opus-mt-en-fr",
    device: "gpu"
  },

  // Mozilla tab grouping
  tabGrouping: {
    modelHub: "mozilla",
    taskName: "summarization",
    modelId: "smart-tab-topic",
    device: "wasm"
  }
};

// 8. Create Multiple Engines
async function createMultipleEngines(configs) {
  const engines = {};
  
  for (const [name, config] of Object.entries(configs)) {
    try {
      engines[name] = await browser.trial.ml.createEngine(config);
      console.log(`Created ${name} engine`);
    } catch (error) {
      console.error(`Failed to create ${name} engine:`, error);
    }
  }
  
  return engines;
}

// Initialize model manager
const modelManager = new ModelManager();

// Export functions and classes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ModelConfigs,
    ModelManager,
    createEngineWithModel,
    createOptimizedEngine,
    createTabGroupingEngine,
    generateTabGroupLabel,
    ExampleConfigs,
    createMultipleEngines,
    modelManager
  };
}