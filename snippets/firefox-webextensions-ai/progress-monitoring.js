// Progress Monitoring and Event Handling for WebExtensions AI

// 1. Progress Event Listener
function setupProgressListener() {
  // Listen for engine progress events
  browser.trial.ml.onProgress.addListener((progress) => {
    console.log("AI Engine Progress:", progress);
    
    // Handle different progress types
    switch (progress.type) {
      case 'download':
        console.log(`Downloading model: ${progress.percent}%`);
        updateProgressBar(progress.percent);
        break;
      case 'initialization':
        console.log("Initializing AI engine...");
        showInitializationStatus();
        break;
      case 'inference':
        console.log(`Processing: ${progress.percent}%`);
        updateInferenceProgress(progress.percent);
        break;
      default:
        console.log("Unknown progress type:", progress.type);
    }
  });
}

// 2. Advanced Engine Creation with Progress
async function createEngineWithProgress(taskName, modelHub = "huggingface") {
  return new Promise((resolve, reject) => {
    let engineCreated = false;

    // Set up progress listener
    const progressListener = (progress) => {
      console.log(`Engine creation progress: ${progress.percent}%`);
      
      if (progress.type === 'download') {
        updateUI(`Downloading model: ${progress.percent}%`);
      } else if (progress.type === 'initialization') {
        updateUI("Setting up AI engine...");
      }
    };

    // Add listener
    browser.trial.ml.onProgress.addListener(progressListener);

    // Create engine
    browser.trial.ml.createEngine({
      modelHub: modelHub,
      taskName: taskName
    }).then((engine) => {
      engineCreated = true;
      // Remove listener
      browser.trial.ml.onProgress.removeListener(progressListener);
      resolve(engine);
    }).catch((error) => {
      // Remove listener on error
      browser.trial.ml.onProgress.removeListener(progressListener);
      reject(error);
    });

    // Timeout handling
    setTimeout(() => {
      if (!engineCreated) {
        browser.trial.ml.onProgress.removeListener(progressListener);
        reject(new Error("Engine creation timeout"));
      }
    }, 60000); // 60 second timeout
  });
}

// 3. UI Progress Updates
function updateProgressBar(percent) {
  const progressBar = document.getElementById('ai-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${Math.round(percent)}%`;
  }
}

function updateUI(message) {
  const statusElement = document.getElementById('ai-status');
  if (statusElement) {
    statusElement.textContent = message;
  }
  console.log(message);
}

function showInitializationStatus() {
  updateUI("Initializing AI model...");
  const spinner = document.getElementById('ai-spinner');
  if (spinner) {
    spinner.style.display = 'block';
  }
}

function updateInferenceProgress(percent) {
  updateUI(`Processing your request: ${Math.round(percent)}%`);
  updateProgressBar(percent);
}

// 4. Complete Example with Progress Handling
async function summarizeWithProgress(text) {
  try {
    // Show initial status
    updateUI("Preparing AI summarization...");
    
    // Create engine with progress monitoring
    const engine = await createEngineWithProgress("summarization");
    
    // Update UI for inference phase
    updateUI("Generating summary...");
    
    // Run inference
    const result = await browser.trial.ml.runEngine({
      args: [text]
    });
    
    // Update UI on completion
    updateUI("Summary complete!");
    
    return result;
  } catch (error) {
    updateUI(`Error: ${error.message}`);
    throw error;
  }
}

// 5. Progress HTML Template
const progressHTML = `
<div id="ai-progress-container" style="margin: 10px 0;">
  <div id="ai-status" style="margin-bottom: 5px;">Ready</div>
  <div style="background: #f0f0f0; border-radius: 5px; overflow: hidden;">
    <div id="ai-progress-bar" style="
      width: 0%;
      height: 20px;
      background: linear-gradient(90deg, #4CAF50, #45a049);
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
    ">0%</div>
  </div>
  <div id="ai-spinner" style="display: none; margin-top: 5px;">
    <div style="
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    "></div>
  </div>
</div>
<style>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>`;

// 6. Initialize Progress UI
function initializeProgressUI() {
  const container = document.createElement('div');
  container.innerHTML = progressHTML;
  document.body.appendChild(container);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setupProgressListener,
    createEngineWithProgress,
    updateProgressBar,
    updateUI,
    summarizeWithProgress,
    initializeProgressUI
  };
}