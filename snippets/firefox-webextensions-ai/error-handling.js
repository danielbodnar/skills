// Error Handling and Recovery for WebExtensions AI

// 1. Common Error Types
const AIErrors = {
  PERMISSION_DENIED: "Permission denied - ensure 'trialML' permission is granted",
  MODEL_NOT_FOUND: "Model not found - check model ID and hub configuration",
  NETWORK_ERROR: "Network error - check internet connection for model download",
  MEMORY_ERROR: "Insufficient memory - model may be too large for device",
  TIMEOUT_ERROR: "Operation timeout - model download or inference took too long",
  INVALID_INPUT: "Invalid input - check input format and parameters",
  ENGINE_ERROR: "Engine error - AI engine failed to process request",
  UNSUPPORTED_TASK: "Unsupported task - task not available for selected model",
  QUOTA_EXCEEDED: "Quota exceeded - too many concurrent requests",
  DEVICE_ERROR: "Device error - GPU/WASM runtime not available"
};

// 2. Error Classification
function classifyError(error) {
  const message = error.message.toLowerCase();
  
  if (message.includes('permission')) {
    return { type: 'PERMISSION_DENIED', recoverable: false };
  }
  if (message.includes('model') && message.includes('not found')) {
    return { type: 'MODEL_NOT_FOUND', recoverable: true };
  }
  if (message.includes('network') || message.includes('connection')) {
    return { type: 'NETWORK_ERROR', recoverable: true };
  }
  if (message.includes('memory') || message.includes('oom')) {
    return { type: 'MEMORY_ERROR', recoverable: true };
  }
  if (message.includes('timeout')) {
    return { type: 'TIMEOUT_ERROR', recoverable: true };
  }
  if (message.includes('invalid') || message.includes('format')) {
    return { type: 'INVALID_INPUT', recoverable: false };
  }
  if (message.includes('engine')) {
    return { type: 'ENGINE_ERROR', recoverable: true };
  }
  if (message.includes('unsupported') || message.includes('task')) {
    return { type: 'UNSUPPORTED_TASK', recoverable: true };
  }
  if (message.includes('quota') || message.includes('limit')) {
    return { type: 'QUOTA_EXCEEDED', recoverable: true };
  }
  if (message.includes('device') || message.includes('gpu') || message.includes('wasm')) {
    return { type: 'DEVICE_ERROR', recoverable: true };
  }
  
  return { type: 'UNKNOWN', recoverable: false };
}

// 3. Retry Logic with Exponential Backoff
async function retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const errorInfo = classifyError(error);
      
      if (!errorInfo.recoverable || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 4. Graceful Engine Creation with Fallbacks
async function createEngineWithFallback(taskName, options = {}) {
  const fallbackStrategies = [
    // Strategy 1: Preferred configuration
    () => browser.trial.ml.createEngine({
      modelHub: options.modelHub || "huggingface",
      taskName: taskName,
      device: options.device || "gpu",
      quantization: options.quantization || "fp16",
      ...options
    }),
    
    // Strategy 2: Fallback to WASM
    () => browser.trial.ml.createEngine({
      modelHub: options.modelHub || "huggingface",
      taskName: taskName,
      device: "wasm",
      quantization: "int8"
    }),
    
    // Strategy 3: Different model
    () => browser.trial.ml.createEngine({
      modelHub: "huggingface",
      taskName: taskName,
      modelId: getAlternativeModel(taskName),
      device: "wasm",
      quantization: "int8"
    })
  ];

  for (const [index, strategy] of fallbackStrategies.entries()) {
    try {
      console.log(`Trying engine creation strategy ${index + 1}`);
      return await retryWithBackoff(strategy);
    } catch (error) {
      console.warn(`Strategy ${index + 1} failed:`, error.message);
      
      if (index === fallbackStrategies.length - 1) {
        throw new Error(`All fallback strategies failed. Last error: ${error.message}`);
      }
    }
  }
}

// 5. Alternative Model Selection
function getAlternativeModel(taskName) {
  const alternatives = {
    summarization: ["t5-small", "distilbart-cnn-6-6"],
    "text-classification": ["distilbert-base-uncased-finetuned-sst-2-english"],
    translation: ["Helsinki-NLP/opus-mt-en-fr", "Helsinki-NLP/opus-mt-en-de"],
    "text-generation": ["distilgpt2", "gpt2"],
    "question-answering": ["distilbert-base-cased-distilled-squad"]
  };
  
  return alternatives[taskName]?.[0] || null;
}

// 6. Safe Inference with Input Validation
async function safeInference(engine, input, options = {}) {
  const { timeout = 30000, maxInputLength = 10000 } = options;
  
  try {
    // Input validation
    if (!input || (typeof input === 'string' && input.length === 0)) {
      throw new Error("Input cannot be empty");
    }
    
    if (typeof input === 'string' && input.length > maxInputLength) {
      console.warn(`Input truncated from ${input.length} to ${maxInputLength} characters`);
      input = input.substring(0, maxInputLength);
    }
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Inference timeout")), timeout);
    });
    
    // Run inference with timeout
    const inferencePromise = browser.trial.ml.runEngine({ args: [input] });
    
    return await Promise.race([inferencePromise, timeoutPromise]);
    
  } catch (error) {
    const errorInfo = classifyError(error);
    console.error(`Inference failed (${errorInfo.type}):`, error.message);
    
    // Return fallback result for certain error types
    if (errorInfo.type === 'TIMEOUT_ERROR' || errorInfo.type === 'MEMORY_ERROR') {
      return { error: true, message: "Processing failed, please try with shorter input" };
    }
    
    throw error;
  }
}

// 7. Error Recovery UI
function showErrorMessage(error, container) {
  const errorInfo = classifyError(error);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'ai-error';
  errorDiv.innerHTML = `
    <div style="
      background: #ffebee;
      border: 1px solid #f44336;
      border-radius: 4px;
      padding: 12px;
      margin: 10px 0;
      color: #c62828;
    ">
      <strong>AI Error:</strong> ${AIErrors[errorInfo.type] || error.message}
      ${errorInfo.recoverable ? '<br><small>This error may be temporary. Please try again.</small>' : ''}
    </div>
  `;
  
  if (container) {
    container.appendChild(errorDiv);
  }
  
  return errorDiv;
}

// 8. Comprehensive Error Handler
class AIErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }
  
  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: error.message,
      type: classifyError(error).type,
      context: context,
      stack: error.stack
    };
    
    this.errorLog.push(errorEntry);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
    
    console.error('AI Error logged:', errorEntry);
  }
  
  getErrorStats() {
    const stats = {};
    this.errorLog.forEach(entry => {
      stats[entry.type] = (stats[entry.type] || 0) + 1;
    });
    return stats;
  }
  
  getRecentErrors(count = 10) {
    return this.errorLog.slice(-count);
  }
  
  clearLog() {
    this.errorLog = [];
  }
}

// 9. Complete Error-Safe AI Operation
async function performAIOperation(taskName, input, options = {}) {
  const errorHandler = new AIErrorHandler();
  
  try {
    // Step 1: Create engine with fallbacks
    const engine = await createEngineWithFallback(taskName, options);
    
    // Step 2: Perform inference safely
    const result = await safeInference(engine, input, options);
    
    return { success: true, result };
    
  } catch (error) {
    errorHandler.logError(error, { taskName, inputLength: input?.length });
    
    return {
      success: false,
      error: error.message,
      errorType: classifyError(error).type,
      recoverable: classifyError(error).recoverable
    };
  }
}

// 10. Usage Examples
async function exampleErrorHandling() {
  // Example 1: Basic error handling
  try {
    const result = await performAIOperation("summarization", "Long text to summarize...");
    if (result.success) {
      console.log("Summary:", result.result);
    } else {
      console.error("Failed:", result.error);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
  
  // Example 2: With custom options
  const result = await performAIOperation("text-classification", "Sample text", {
    timeout: 45000,
    maxInputLength: 5000,
    device: "gpu"
  });
  
  if (!result.success && result.recoverable) {
    console.log("Retrying with different parameters...");
    // Implement retry logic
  }
}

// Initialize global error handler
const globalErrorHandler = new AIErrorHandler();

// Export functions and classes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AIErrors,
    classifyError,
    retryWithBackoff,
    createEngineWithFallback,
    safeInference,
    showErrorMessage,
    AIErrorHandler,
    performAIOperation,
    globalErrorHandler
  };
}